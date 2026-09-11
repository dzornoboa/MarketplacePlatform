# WTC Accra Hub — design system guidelines

Derived from the **WTCA Member Brand Guidelines** and the **WTCA Brand Editorial Guide**
(`public/brand/Full Brand Assets/Brand Guidelines/`). These are brand rules, not preferences —
WTCA brand compliance depends on them.

## Non-negotiables

* **No gradients.** Anywhere. Solid colours only.
* **Pure white first.** White backgrounds and generous white space are the default. Solid
  colours from the palette below are the only approved alternative background.
* **Logos are never recoloured**, angled, placed in a container, given effects, or laid over
  imagery or busy backgrounds. Black, white, or brand colours only.
* Keep ~35px of clear space around the logo; anchor it to a corner (top-left for digital).
* Photography must not include minors, airplanes, country flags, or WTC New York.

## Colour tokens (`app/globals.css`)

| Token | Hex | Role |
|---|---|---|
| `--wtc-navy` | `#154074` | Primary. Headings, active states, solid panels |
| `--wtc-orange` | `#E4580A` | Primary accent. Primary CTA, eyebrows, rules |
| `--wtc-sky` | `#4D8BBE` | Primary, supporting |
| `--wtc-peach` | `#F9A25E` | Primary, supporting |
| `--wtc-teal` | `#09D0AC` | Secondary. Circle motif, success accents |
| `--wtc-gold` | `#E5C056` | Secondary. Circle motif, accents on navy |
| `--wtc-mist` | `#ECECEF` | Secondary. Soft section and app-shell background |
| `--wtc-grey` | `#A9A9AB` | Secondary. Hairlines and dividers only |

`--ink`, `--muted`, `--line`, `--danger`, `--success` and `--warning` are UI-only derivations
of the above, darkened where body copy needs to clear WCAG AA. Do not introduce new hues —
status colours are darkened brand hues, never a new red or green.

## Typography

* **Open Sans** for everything (the brand font for both logo and copy), loaded in
  `app/layout.tsx`.
* Marketing headlines use the WTCA lockup: light weight (300) uppercase lead with a bold (800)
  navy emphasis — `<h2>A business platform with <strong>verification at its core</strong></h2>`.
  Use `.display` for the hero, `.section-head h2` elsewhere.
* Eyebrows are 11px, uppercase, `.22em` tracking, orange.
* Application UI (dashboard, admin) uses sentence-case bold headings for legibility.

## The circle motif

The brand circle represents the connections the network facilitates. Use `<BrandCircle>` /
`<BrandArc>` from `components/brand.tsx` — four arcs in navy, gold, orange and teal, reproduced
from `Large Circle 4 Colors`. It is decorative: park it behind content with `.motif`, never over
the logo or text. Imagery is circle-masked (`.media-circle`).

## Components

Brand marks live in `components/brand.tsx` (`Logo`, `LogoLink`, `MemberMark`, `BrandCircle`,
`BrandArc`). Use them rather than re-importing image paths. `MemberMark` is the
"A Member of World Trade Centers Association" lockup with the *Connecting Businesses, Globally.*
tagline — footer only.

## Voice

Primary archetype **The Sage** (wise, trusted, mentoring), secondary **The Ruler** (organised,
prestigious, secure). Tagline: *Connecting Businesses, Globally.* Approved headline language is
in the editorial guide — prefer it over invented copy.
