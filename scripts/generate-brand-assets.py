#!/usr/bin/env python3
"""Generate Beyon Vital web assets from the raw files in assets/source.

Outputs (all committed):
  public/brand/logo-full.png      full lockup, transparent, brand-exact colors
  public/brand/logo.png           mark only, 1024 square, transparent
  public/brand/logo-mark.png      mark only, 512 square, transparent
  public/brand/email-logo.png     mark on a white rounded tile (safe in dark-mode clients)
  public/brand/og-image.png       1200x630 social card
  app/icon.png, app/apple-icon.png, public/favicon*.png, public/favicon.ico,
  public/android-chrome-*.png, public/site.webmanifest
  public/images/home/*.webp       real home photos (auto-oriented, <=1600px)
  public/images/people/*.webp     placeholder slots for illustrative lifestyle images

Placeholders are only written when the file is missing, so real images dropped in
at those paths are never overwritten.

Run: npm run generate:brand
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'source'
PUBLIC = ROOT / 'public'
BRAND = PUBLIC / 'brand'

RED = (168, 57, 42)        # #A8392A
SAGE = (157, 170, 140)     # #9DAA8C
SAGE_DARK = (110, 122, 94) # subline on light backgrounds, logo-only
INK = (31, 26, 23)         # #1F1A17
CREAM = (247, 242, 234)    # #F7F2EA
MUTED = (91, 82, 76)       # #5B524C

HOME_PHOTOS = {
    'IMG-20260913-WA0014.jpg': 'bathroom-half',
    'IMG-20260913-WA0016.jpg': 'kitchen-dining',
    'IMG-20260913-WA0018.jpg': 'exterior',
    'IMG-20260913-WA0020.jpg': 'bedroom-twin-beds',
    'IMG-20260913-WA0022.jpg': 'living-room',
    'IMG-20260913-WA0024.jpg': 'bathroom-full',
    'IMG-20260913-WA0026.jpg': 'bedroom-queen',
    'IMG-20260913-WA0028.jpg': 'backyard-patio',
    'IMG-20260913-WA0030.jpg': 'bedroom-sleigh',
    'IMG-20260913-WA0032.jpg': 'staircase',
}

PEOPLE_PLACEHOLDERS = {
    'hero': (1600, 1000),
    'community-outing': (1200, 800),
    'life-coaching': (1200, 800),
    'volunteer': (1200, 800),
    'staff-care': (1200, 800),
}


def recolor(rgb: np.ndarray, alpha: np.ndarray, subline_from_row: int | None = None) -> Image.Image:
    """Snap every visible pixel to the exact brand red or sage, keeping antialiased alpha."""
    r, g = rgb[..., 0].astype(float), rgb[..., 1].astype(float)
    is_red = r > g * 1.45
    out = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    out[..., :3] = np.where(is_red[..., None], RED, SAGE)
    if subline_from_row is not None:
        rows = np.arange(alpha.shape[0])[:, None] >= subline_from_row
        out[..., :3] = np.where((~is_red & rows)[..., None], SAGE_DARK, out[..., :3])
    out[..., 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def trim(img: Image.Image, pad_ratio: float = 0.0, square: bool = False) -> Image.Image:
    bbox = img.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
    img = img.crop(bbox)
    w, h = img.size
    side_w, side_h = (max(w, h), max(w, h)) if square else (w, h)
    pad = int(max(side_w, side_h) * pad_ratio)
    canvas = Image.new('RGBA', (side_w + pad * 2, side_h + pad * 2), (0, 0, 0, 0))
    canvas.paste(img, ((canvas.width - w) // 2, (canvas.height - h) // 2), img)
    return canvas


def fit(img: Image.Image, size: int, bg=None, scale: float = 1.0) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), bg + (255,) if bg else (0, 0, 0, 0))
    inner = max(1, round(size * scale))
    mark = img.copy()
    mark.thumbnail((inner, inner), Image.LANCZOS)
    canvas.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    return canvas


def font(names: list[str], size: int):
    for name in names:
        for base in ('/System/Library/Fonts/Supplemental', '/System/Library/Fonts'):
            path = Path(base) / name
            if path.exists():
                return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def build_logos():
    BRAND.mkdir(parents=True, exist_ok=True)

    # Full lockup: source is red/sage on black, so alpha comes from brightness.
    src = np.array(Image.open(SRC / 'beyon_logo.png').convert('RGB')).astype(float)
    brightness = src.max(axis=-1)
    alpha = np.clip((brightness - 18) / (95 - 18), 0, 1) * 255
    full = trim(recolor(src, alpha, subline_from_row=760), pad_ratio=0.02)
    full.thumbnail((1400, 1400), Image.LANCZOS)
    full.save(BRAND / 'logo-full.png', optimize=True)

    # Mark: source is already transparent but carries a blurred ghost of the subline
    # below the mark (rows > ~770); crop it off before trimming.
    icon = Image.open(SRC / 'beyon_icon.png').convert('RGBA')
    icon = icon.crop((0, 0, icon.width, 775))
    arr = np.array(icon).astype(float)
    mark = trim(recolor(arr[..., :3], arr[..., 3]), square=True)
    fit(mark, 1024, scale=0.96).save(BRAND / 'logo.png', optimize=True)
    fit(mark, 512, scale=0.96).save(BRAND / 'logo-mark.png', optimize=True)
    return full, mark


def build_email_logo(mark: Image.Image):
    size, radius = 176, 36
    tile = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=(255, 255, 255, 255))
    inner = fit(mark, size, scale=0.74)
    tile.alpha_composite(inner)
    tile.save(BRAND / 'email-logo.png', optimize=True)


def build_icons(mark: Image.Image):
    app = ROOT / 'app'
    fit(mark, 512, scale=0.92).save(app / 'icon.png', optimize=True)
    fit(mark, 180, bg=CREAM, scale=0.76).convert('RGB').save(app / 'apple-icon.png', optimize=True)
    fit(mark, 16, scale=1.0).save(PUBLIC / 'favicon-16x16.png')
    fit(mark, 32, scale=1.0).save(PUBLIC / 'favicon-32x32.png')
    fit(mark, 192, bg=CREAM, scale=0.78).save(PUBLIC / 'android-chrome-192x192.png', optimize=True)
    fit(mark, 512, bg=CREAM, scale=0.78).save(PUBLIC / 'android-chrome-512x512.png', optimize=True)
    fit(mark, 256, scale=1.0).save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

    manifest = {
        'name': 'Beyon Vital Community Services',
        'short_name': 'Beyon Vital',
        'start_url': '/',
        'display': 'standalone',
        'background_color': '#F7F2EA',
        'theme_color': '#A8392A',
        'icons': [
            {'src': '/android-chrome-192x192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': '/android-chrome-512x512.png', 'sizes': '512x512', 'type': 'image/png'},
        ],
    }
    (PUBLIC / 'site.webmanifest').write_text(json.dumps(manifest, indent=2) + '\n')


def build_og(full: Image.Image):
    w, h = 1200, 630
    card = Image.new('RGBA', (w, h), CREAM + (255,))
    draw = ImageDraw.Draw(card)
    draw.rectangle((0, 0, w, 10), fill=RED)
    draw.rectangle((0, h - 120, w, h), fill=(236, 229, 218, 255))

    logo = full.copy()
    logo.thumbnail((720, 330), Image.LANCZOS)
    card.alpha_composite(logo, ((w - logo.width) // 2, 48))

    line1 = 'Residential Group Home  ·  Community Engagement'
    line2 = 'North Chesterfield, VA   ·   (804) 366-3442   ·   beyonvital.com'
    f1 = font(['Georgia Bold.ttf', 'Georgia.ttf'], 40)
    f2 = font(['Arial.ttf'], 26)
    for text, fnt, y, color in ((line1, f1, 418, INK), (line2, f2, h - 76, MUTED)):
        tw = draw.textlength(text, font=fnt)
        draw.text(((w - tw) / 2, y), text, font=fnt, fill=color)
    card.convert('RGB').save(BRAND / 'og-image.png', optimize=True)


def build_home_photos():
    out = PUBLIC / 'images' / 'home'
    out.mkdir(parents=True, exist_ok=True)
    for src_name, name in HOME_PHOTOS.items():
        img = ImageOps.exif_transpose(Image.open(SRC / src_name)).convert('RGB')
        img.thumbnail((1600, 1600), Image.LANCZOS)
        dest = out / f'{name}.webp'
        img.save(dest, 'WEBP', quality=80, method=6)
        print(f'  {dest.relative_to(ROOT)}  {img.width}x{img.height}  {dest.stat().st_size // 1024} KB')


def build_people_placeholders():
    out = PUBLIC / 'images' / 'people'
    out.mkdir(parents=True, exist_ok=True)
    for i, (name, (w, h)) in enumerate(PEOPLE_PLACEHOLDERS.items()):
        dest = out / f'{name}.webp'
        if dest.exists():
            print(f'  keep existing {dest.relative_to(ROOT)}')
            continue
        # Soft cream -> sage diagonal wash with a faint warm glow; no text, no faces.
        y, x = np.mgrid[0:h, 0:w].astype(float)
        t = np.clip((x / w * 0.6 + y / h * 0.4), 0, 1)[..., None]
        base = np.array(CREAM) * (1 - t) + np.array((214, 221, 204)) * t
        cx, cy = w * (0.25 + 0.15 * i), h * 0.3
        glow = np.exp(-(((x - cx) / (w * 0.45)) ** 2 + ((y - cy) / (h * 0.55)) ** 2))[..., None]
        img = base * (1 - glow * 0.18) + np.array((232, 196, 182)) * glow * 0.18
        Image.fromarray(img.astype(np.uint8), 'RGB').filter(ImageFilter.GaussianBlur(2)).save(dest, 'WEBP', quality=80)
        print(f'  placeholder {dest.relative_to(ROOT)}  {w}x{h}')


if __name__ == '__main__':
    full, mark = build_logos()
    build_email_logo(mark)
    build_icons(mark)
    build_og(full)
    print('home photos:')
    build_home_photos()
    print('people placeholders:')
    build_people_placeholders()
    print('done')
