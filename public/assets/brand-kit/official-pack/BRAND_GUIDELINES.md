# Capitol Twin Cinema — Brand Identity & Asset Guidelines

**Location:** 120 Wallace Ave. N., Listowel, Ontario  
**Heritage:** Established 1956  
**Core Slogan:** *"Big Screen • Big Sound • Small Prices"*

---

## 1. Brand Identity Overview

The Capitol Twin Cinema visual identity celebrates classic independent moviehouse prestige while delivering punchy, modern high-contrast readability across physical signage, 4K print, mobile web, and social feeds.

Built from the ground up around the **Primary Stacked Emblem**, the brand architecture unifies:
1. **The Faceted 3D Ruby Star:** A 10-point gem-cut star with rich crimson gradients, beveled starlight facets, and a burnished golden perimeter rim.
2. **Dual 35mm Filmstrip Wings:** Flanking aerodynamic filmstrips in deep slate charcoal (`#181B1E`) with luminous cyan projection cell apertures (`#8EDBE9` → `#55B5C9`).
3. **Marquee Gold Typography:** Hand-spaced ultra-heavy geometric letterforms ("CAPITOL TWIN CINEMA") finished with a radiant top-to-bottom gold gradient and sharp contrast outlines.
4. **The "EST. 1956" Chevron Plaque:** An elongated golden hexagonal badge honoring the cinema's founding year in downtown Listowel.
5. **The Community Slogan:** *"BIG SCREEN • BIG SOUND • SMALL PRICES"*—anchoring the cinema's value promise.

---

## 2. Official Color Palette

| Swatch | Color Name | Hex Code | RGB | CMYK | Semantic Usage |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 🔴 | **Ruby Crimson** | `#E63946` | `230, 57, 70` | `0, 90, 65, 0` | Star light facets, ticket headers, concession badges |
| 🍷 | **Deep Velvet Red** | `#780000` | `120, 0, 0` | `20, 100, 100, 45` | Star shadow facets, dramatic cinematic backdrops |
| 🟡 | **Marquee Gold Rim** | `#FFDF73` | `255, 223, 115` | `0, 12, 60, 0` | Highlight edges, star rim, bulb glows, text top gradient |
| 🥇 | **Amber Gold** | `#F5A914` | `245, 169, 20` | `0, 36, 95, 0` | Text base gradient, plaque fill, metallic borders |
| 🥉 | **Burnished Gold** | `#9C6B0D` | `156, 107, 13` | `20, 48, 100, 35` | Gold bevel shadows, plaque stroke borders |
| 🔷 | **35mm Film Cyan** | `#8EDBE9` | `142, 219, 233` | `40, 0, 10, 0` | Filmstrip cell apertures, "Coming Soon" accents |
| 🌊 | **Deep Projection Cyan**| `#55B5C9` | `85, 181, 201` | `62, 10, 18, 0` | Film cell lower gradient, accent dividers |
| ⬛ | **Filmstrip Slate** | `#181B1E` | `24, 27, 30` | `70, 60, 55, 75` | Filmstrip wing body, dark containers, UI frames |
| 🌑 | **Midnight Charcoal** | `#14171A` | `20, 23, 26` | `75, 65, 60, 80` | Typography outline strokes, dark mode backgrounds |
| ⚪ | **Screen Cream** | `#FFFDF5` | `255, 253, 245` | `0, 1, 4, 0` | Body copy, slogan text, high-contrast reverse type |

### CSS Variables
```css
:root {
  --capitol-ruby: #E63946;
  --capitol-velvet: #780000;
  --capitol-gold-light: #FFDF73;
  --capitol-gold-amber: #F5A914;
  --capitol-gold-dark: #9C6B0D;
  --capitol-cyan-light: #8EDBE9;
  --capitol-cyan-deep: #55B5C9;
  --capitol-slate: #181B1E;
  --capitol-midnight: #14171A;
  --capitol-cream: #FFFDF5;
}
```

---

## 3. Logo Suite & Hierarchy

### 1. Primary Stacked Emblem (`logo-stacked-badge.svg` / `capitol_primary_stacked.svg`)
* **Role:** Master brand identifier.
* **Usage:** Hero banner, marketing centerpieces, print programs, and official stationery.
* **Aspect Ratio:** 1:1 square canvas (800×800 viewBox).

### 2. Horizontal Lockup (`logo-primary-horizontal.svg` / `capitol_horizontal_lockup.svg`)
* **Role:** Widescreen and navigation lockup.
* **Usage:** Website sticky navbars, email mastheads, highway billboard signage, and cinema entrance marquees.
* **Aspect Ratio:** 3:1 landscape canvas (1200×400 viewBox).

### 3. Compact Icon Mark (`logo-monogram-icon.svg` / `capitol_icon_mark.svg`)
* **Role:** Standalone emblem mark.
* **Usage:** Favicons, social avatars, app icons, watermark overlays, and staff uniform embroidery.

### 4. Luxury Gold Variant (`logo-retro-marquee.svg` / `capitol_luxury_gold.svg`)
* **Role:** Premium metallic monochromatic execution.
* **Usage:** Anniversary screenings, donor plaques, VIP passes, gold-foil gift certificates, and holiday galas.

### 5. Dark Mode Optimized (`logo-dark-mode.svg`)
* **Role:** Digital dark theme display.
* **Usage:** OLED dark-mode web experiences, mobile theater displays, and illuminated night readerboards.

### 6. Monochrome Silhouette — Black & White (`logo-black-monochrome.svg` / `logo-white-monochrome.svg`)
* **Role:** Single-color high-contrast reproduction.
* **Usage:** Newsprint listings, thermal receipt rolls, rubber stamps, single-color apparel, and screen printing.

---

## 4. Typography System

* **Primary Marquee Brand Display:** **Montserrat 900 (Black)**
  * *Tracking:* `+4px` to `+5px` on "CAPITOL"
  * *Stroke:* `#14171A` outline (4.5px) with `paint-order: stroke fill`
* **Secondary Brand Display:** **Montserrat 800 (ExtraBold)**
  * *Tracking:* `+10px` to `+12px` on "TWIN CINEMA"
* **Badge & Plaque Display:** **Montserrat 900 (Black)**
  * *Tracking:* `+4px` on "EST. 1956"
* **Slogan & Operational Copy:** **Montserrat / Inter** (Bold / SemiBold)
  * *Tracking:* `+5px` all-caps on "BIG SCREEN • BIG SOUND • SMALL PRICES"

---

## 5. Clear Space & Sizing Rules

* **Clear Space Rule:** Maintain an exclusion perimeter around the emblem equal to at least 15% of the total symbol height. Do not crowd the wings or baseline with competing copy.
* **Minimum Digital Sizes:**
  * Primary Stacked Emblem: Minimum 96×96px.
  * Horizontal Lockup: Minimum 180×60px.
  * Icon Mark / Favicon: Minimum 16×16px (simplified rendering down to 64px, 32px, 16px).
* **Minimum Print Sizes:**
  * Primary Stacked Emblem: Minimum 25mm (1.0 inch) wide.
  * Horizontal Lockup: Minimum 45mm (1.75 inches) wide.

---

## 6. Prohibited Usage

* ❌ **Do NOT** alter the facet geometry, star point count, or lighting angles.
* ❌ **Do NOT** replace the cyan film cell windows with unrelated colors.
* ❌ **Do NOT** stretch, squeeze, or skew the typography.
* ❌ **Do NOT** modify "EST. 1956" to another date.
* ❌ **Do NOT** place the color emblem on a clashing, low-contrast patterned background without a dark vignette or plaque backing.
