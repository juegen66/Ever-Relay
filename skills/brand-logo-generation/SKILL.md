---
name: brand-logo-generation
description: Generate 3 raw SVG logo concepts for logo workflow step 2
version: 1.0.0
tags: [branding, logo-design, svg, logo-concepts]
---

# Brand Logo Generation Skill

Guide JSON output with 3 raw SVG logo concepts. The logo workflow is in-memory—output raw SVG strings only. No React/TSX, no file paths, no `export` or component wrappers.

## Concept Types

Generate exactly 3 lockups: **icon_only**, **icon_with_wordmark**, **wordmark_only**.

| conceptType | Description | Example |
|-------------|--------------|---------|
| icon_only | Symbol/mark only, no text. Graphics only (`path`, `circle`, etc.). No `<text>` or `<tspan>`. | Nike swoosh |
| icon_with_wordmark | Symbol + company name. Must include both graphics and `<text>`/`<tspan>`. | Apple, Spotify |
| wordmark_only | Typography only. `<text>`/`<tspan>` only. No `path`, `circle`, `rect`, etc. | Google, FedEx |

**Output format:** Each concept is a complete `<svg>...</svg>` string. Return JSON only.

## Example Raw SVG Lockups

**icon_only** (symbol only, no text):

```xml
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="#0066CC" />
  <path d="M15 20 L25 15 L25 25 Z" fill="white" />
</svg>
```

**icon_with_wordmark** (symbol + company name):

```xml
<svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="#0066CC" />
  <path d="M15 20 L25 15 L25 25 Z" fill="white" />
  <text x="50" y="30" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="700" fill="#0066CC">TechStart</text>
</svg>
```

**wordmark_only** (typography only, no graphics):

```xml
<svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="30" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="700" fill="#0066CC">TechStart</text>
</svg>
```

## Color Palette (Design Reference)

| Token | Hex | Use |
|-------|-----|-----|
| primary | #0066CC | Main brand, buttons, links |
| secondary | #FF9100 | CTAs, highlights |
| neutral | #F9FAFB … #111827 | Text, borders, backgrounds |

Use for SVG fills. Ensure WCAG AA contrast when placing text on colored backgrounds.

## Typography (SVG Text)

- **Font:** `fontFamily="Inter, sans-serif"` for logo wordmarks
- **Logo wordmark size:** 20–24px, weight 600–700

## Brand Guidelines (Respect When Generating)

- **Clear space:** Leave breathing room around the mark
- **Scalability:** Design works from 16px to large sizes
- **Don'ts:** No rotation, stretch, shadows, or distortion
- **Monochrome:** Logo should work in single color
