#!/usr/bin/env python3
"""Record a 16:9 walkthrough of the live GeoSolar explorer (map underlayer included)."""

from __future__ import annotations

import http.server
import socketserver
import sys
import threading
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from theme import COPPER, INK, MUTED, PAPER, SUN

OUT = ROOT / "visuals"
W, H = 1440, 810
GIF_W, GIF_H = 960, 540
FPS = 6
PAPER_RGB = (8, 17, 14)  # #08110e


def scene_title():
    import matplotlib.pyplot as plt

    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    fig.patch.set_facecolor(PAPER)
    fig.text(0.08, 0.58, "GeoSolar AI", color=INK, fontsize=42, fontweight="medium")
    fig.text(0.08, 0.48, "Swiss rooftop solar, from the Sonnendach cadastre.", color=MUTED, fontsize=16)
    fig.text(0.08, 0.22, "Hex neighbourhoods  ·  each roof  ·  EN / DE / FR / IT", color=COPPER, fontsize=12)
    fig.text(0.08, 0.14, "Satellite, streets, and buildings underneath.", color=MUTED, fontsize=12)
    return fig


def scene_end():
    import matplotlib.pyplot as plt

    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    fig.patch.set_facecolor(PAPER)
    fig.text(0.08, 0.55, "Open the explorer", color=INK, fontsize=32)
    fig.text(0.08, 0.44, "cd frontend && python3 -m http.server 8000", color=SUN, fontsize=14)
    fig.text(0.08, 0.22, "100,000 official roofs  ·  map underlayer  ·  no live API", color=MUTED, fontsize=12)
    return fig


def fig_to_frame(fig):
    import matplotlib.pyplot as plt

    fig.canvas.draw()
    buf = np.asarray(fig.canvas.buffer_rgba())[:, :, :3].copy()
    plt.close(fig)
    return Image.fromarray(buf).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)


def hold(frames, im: Image.Image, seconds: float):
    n = max(1, int(round(seconds * FPS)))
    arr = np.asarray(im.convert("RGB"))
    frames.extend([arr] * n)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "frontend"), **kwargs)

    def log_message(self, format, *args):
        pass


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def serve_frontend():
    httpd = ReuseTCPServer(("127.0.0.1", 0), QuietHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, httpd.server_address[1]


def wait_ready(page):
    page.wait_for_selector("#city-row button", timeout=30000)
    page.wait_for_function(
        "() => document.querySelectorAll('#city-row button').length >= 8 && window.GeoSolar",
        timeout=30000,
    )
    page.evaluate(
        """() => {
          const g = window.GeoSolar;
          if (g && g.map) {
            g.map.invalidateSize();
          }
        }"""
    )


def wait_tiles(page, min_ok=4, extra_ms=1100):
    try:
        page.wait_for_function(
            f"""() => {{
              const imgs = [...document.querySelectorAll('.leaflet-tile-pane img')];
              return imgs.filter(i => i.complete && i.naturalWidth > 0).length >= {min_ok};
            }}""",
            timeout=20000,
        )
    except Exception:
        pass
    page.wait_for_timeout(extra_ms)
    page.evaluate(
        """() => new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        })"""
    )


def grab(page) -> Image.Image:
    raw = page.screenshot(type="png", animations="disabled")
    return Image.open(BytesIO(raw)).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)


def act(page, js: str, min_ok=4, extra_ms=1100):
    page.evaluate(js)
    wait_tiles(page, min_ok=min_ok, extra_ms=extra_ms)


def record_live():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise SystemExit(
            "Playwright is required to capture the live explorer.\n"
            "  .venv/bin/pip install playwright"
        ) from exc

    httpd, port = serve_frontend()
    shots: list[Image.Image] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                channel="chrome",
                headless=True,
                args=["--hide-scrollbars", "--disable-dev-shm-usage"],
            )
            context = browser.new_context(
                viewport={"width": W, "height": H},
                device_scale_factor=1,
                color_scheme="dark",
            )
            context.add_init_script("localStorage.setItem('geosolar-lang', 'en');")
            page = context.new_page()
            page.goto(f"http://127.0.0.1:{port}/?demo=1", wait_until="domcontentloaded")
            wait_ready(page)
            wait_tiles(page, min_ok=4, extra_ms=1600)

            # 1 Switzerland hex over imagery
            shots.append(grab(page))

            # 2 class floor 4 — dim low cells, copper remains
            act(page, "GeoSolar.setFloor(4)", extra_ms=700)
            shots.append(grab(page))

            # 3 colour by share of class 4–5
            act(page, "GeoSolar.setFloor(1); GeoSolar.setMode('pct4')", extra_ms=700)
            shots.append(grab(page))

            # 4 Sion — Valais, high class over alpine terrain
            act(
                page,
                "GeoSolar.setMode('mean'); GeoSolar.goCity('vs')",
                min_ok=4,
                extra_ms=1400,
            )
            shots.append(grab(page))

            # 5 Zürich hex — streets visible through cells
            act(page, "GeoSolar.goCity('zh')", min_ok=4, extra_ms=1500)
            shots.append(grab(page))

            # 6 Each roof on Zürich — buildings, rail, cadastre points
            act(page, "GeoSolar.setViewMode('roofs')", min_ok=4, extra_ms=1800)
            shots.append(grab(page))

            # 7 German UI on the same roof view
            act(page, "GeoSolar.setLang('de')", min_ok=4, extra_ms=600)
            shots.append(grab(page))

            # 8 back to national hex, French
            act(
                page,
                "GeoSolar.setLang('fr'); GeoSolar.setViewMode('hex'); GeoSolar.goCity('ch')",
                min_ok=4,
                extra_ms=1500,
            )
            shots.append(grab(page))

            browser.close()
    finally:
        httpd.shutdown()
        httpd.server_close()
    return shots


def pad16(arr: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    nh = (h + 15) // 16 * 16
    nw = (w + 15) // 16 * 16
    if nh == h and nw == w:
        return arr
    out = np.empty((nh, nw, 3), dtype=arr.dtype)
    out[:] = PAPER_RGB
    out[:h, :w] = arr
    return out


def write_outputs(frames):
    import imageio.v2 as imageio

    gif_frames = [
        np.asarray(Image.fromarray(f).resize((GIF_W, GIF_H), Image.Resampling.LANCZOS))
        for f in frames
    ]
    gif = OUT / "explorer_demo.gif"
    mp4 = OUT / "explorer_demo.mp4"
    imageio.mimsave(gif, gif_frames, fps=FPS, loop=0)
    print("wrote", gif, gif.stat().st_size)
    imageio.mimsave(mp4, [pad16(f) for f in frames], fps=FPS, codec="libx264", quality=7)
    print("wrote", mp4, mp4.stat().st_size)


def main():
    frames: list[np.ndarray] = []
    hold(frames, fig_to_frame(scene_title()), 2.2)

    print("capturing live explorer…")
    shots = record_live()
    durations = [2.6, 2.2, 2.2, 2.6, 2.6, 3.2, 2.2, 2.4]
    for im, sec in zip(shots, durations):
        hold(frames, im, sec)

    hold(frames, fig_to_frame(scene_end()), 2.2)
    write_outputs(frames)


if __name__ == "__main__":
    main()
