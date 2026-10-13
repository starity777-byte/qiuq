# Asset Sources & Attribution

This document details the image assets sourced and generated for **QiuQ**, created to match the dreamy rain droplets on frosted glass mood references and recolored to the soft, light, airy pastel palette (`#e2dbed`, `#79a7d9`, `#9a8ec3` + white).

---

## Asset Overview

| File | Resolution | Size | Format | Subject / Mood | Source | Author | License |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `wallpaper.jpg` | 1170 × 2532 | ~378 KB | JPEG | Misty rainy frosted glass with dripping water rivulets | generated | generated | CC0 / Public Domain |
| `photo.jpg` | 800 × 800 | ~83 KB | JPEG | Blurred white stars behind misty rainy glass with droplets | generated | generated | CC0 / Public Domain |
| `album.jpg` | 600 × 600 | ~84 KB | JPEG | White lily behind wet frosted glass with water streaks | generated | generated | CC0 / Public Domain |
| `avatar.jpg` | 300 × 300 | ~31 KB | JPEG | Ethereal aesthetic girl portrait with soft glowing bokeh | generated | generated | CC0 / Public Domain |
| `avatar_bunny.jpg` *(bonus)* | 300 × 300 | ~27 KB | JPEG | Soft fluffy white plush bunny with pastel bokeh | generated | generated | CC0 / Public Domain |

*All files comply with the requirement of being under 600 KB and are verified valid JPEG images.*

---

## Detailed Asset Information

### 1. `wallpaper.jpg`
- **Target Dimensions**: 1170 × 2532 (iPhone screen aspect ratio)
- **File Size**: ~378 KB (< 600 KB limit)
- **Subject**: Misty frosted glass with fine rain droplets, natural condensation texture, and water rivulets dripping down the pane.
- **Source**: generated (AI diffusion synthesis & PIL palette recoloring)
- **Author**: generated
- **License**: generated / CC0 Public Domain
- **Freely-Licensed Reference Alternative**:
  - **Source Title**: *Rain Drops On The Window (68419527)*
  - **Source URL**: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rain_Drops_On_The_Window_(68419527).jpeg) / [Original 500px](https://500px.com/photo/68419527/rain-drops-on-the-window-by-joshua-sampson)
  - **Author**: Joshua Sampson
  - **License**: CC BY 3.0 (Creative Commons Attribution 3.0 Unported)

---

### 2. `photo.jpg`
- **Target Dimensions**: 800 × 800 (Square photo widget)
- **File Size**: ~83 KB (< 600 KB limit)
- **Subject**: Ethereal white 3D star shapes floating softly out-of-focus behind misty, frosted glass covered in crisp raindrops.
- **Source**: generated (AI diffusion synthesis & PIL palette recoloring)
- **Author**: generated
- **License**: generated / CC0 Public Domain
- **Mood Reference Alignment**: Directly mirrors Mood Reference 1 (`983a89e244b926da691fc56feb7fed7854dfdd326cb09db5081e8b088f293eda.jpg`).

---

### 3. `album.jpg`
- **Target Dimensions**: 600 × 600 (Square music album cover)
- **File Size**: ~84 KB (< 600 KB limit)
- **Subject**: A pristine blooming white lily (*Lilium*) positioned behind rainy, condensation-covered glass with delicate rain streaks running across the blossom.
- **Source**: generated (AI diffusion synthesis & PIL palette recoloring)
- **Author**: generated
- **License**: generated / CC0 Public Domain
- **Mood Reference Alignment**: Directly mirrors Mood Reference 2 (`b2d528a1fdc9aeeea9f73c72abe0a117ec6da2a072cea4ba7cfc9c1019b9aacd.jpg`).
- **Freely-Licensed Reference Alternative**:
  - **Source Title**: *Easter Lily close-up - 50970877282*
  - **Source URL**: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Easter_Lily_close-up_-_50970877282.jpg) / [Flickr](https://www.flickr.com/photos/184594136@N08/50970877282/)
  - **Author**: Alabama Extension / Bruce Dupree
  - **License**: CC0 1.0 Universal (Public Domain Dedication)

---

### 4. `avatar.jpg`
- **Target Dimensions**: 300 × 300 (Square user avatar)
- **File Size**: ~31 KB (< 600 KB limit)
- **Subject**: A delicate, soft-lit aesthetic girl portrait with pastel periwinkle hair, lace collar, and hazy glowing bokeh circles.
- **Source**: generated (AI diffusion synthesis & PIL palette recoloring)
- **Author**: generated
- **License**: generated / CC0 Public Domain
- **Bonus Alternative (`avatar_bunny.jpg`)**:
  - Dimensions: 300 × 300 (~27 KB)
  - Subject: Adorable white plush bunny with soft fur and airy bokeh, matching the "Love Songg" plush bunny widget from the reference UI.
  - Source / Author / License: generated / generated / CC0 Public Domain

---

## Color Palette & Processing Pipeline

All assets were graded and recolored using Python Pillow (PIL) to strictly adhere to the user's custom color palette:

| Color Code | RGB Value | Role in Palette |
| :--- | :--- | :--- |
| `#e2dbed` | `(226, 219, 237)` | Soft pale lavender (mist, ambient transitions, soft light) |
| `#79a7d9` | `(121, 167, 217)` | Airy periwinkle / sky blue (cool midtones and glass reflections) |
| `#9a8ec3` | `(154, 142, 195)` | Muted lilac / violet (gentle shadows and background depth) |
| `#ffffff` | `(255, 255, 255)` | Pure white (specular highlights, water droplets, white stars/petals) |

### PIL Processing Details
1. **Luminance LUT Mapping**: Images were mapped across a custom piecewise linear transfer function spanning deep muted lilac `(135, 125, 175)`, `#9a8ec3`, `#79a7d9`, `#e2dbed`, and `#ffffff`.
2. **Subtle Texture Blending**: The recolored gradient ramp was blended with original luminance information (80-85% recolor ramp, 15-20% high-frequency structure) to preserve crisp water droplet rims and micro-textures.
3. **High-Key Luminous Grading**: Brightness and contrast curves were calibrated to produce an airy, low-saturation, high-key Japanese aesthetic inspired by Makoto Shinkai's luminous color direction.
4. **Compression Optimization**: Output as progressive/optimized JPEGs with quality levels between 88 and 92, ensuring every asset remains well under the 600 KB limit.

## Google Drive 前端/素材 (2026-10-13)
wallpaper.jpg=…18_31_56, wallpaper_night.jpg=…18_31_34, photo.jpg=…18_30_49, album.jpg=…18_31_11, avatar.jpg=crop of …18_31_20; drive_1/3/5/8/9.jpg = remaining originals (compressed).
