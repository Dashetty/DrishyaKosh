# Pixel-Perfect Awards Section (hidokmeh.com)

Recreation of the international award-winning showcase section from Dokmeh Agency (hidokmeh.com), featuring the iconic 3D cylindrical project card stack, interactive scrub/scroll synchronization, curved spatial transforms, dynamic project titles, and detailed award accolades.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during the interactive clarification phase:
> - **Interaction Experience**: Scroll-driven 3D stack synchronized with bottom arrow controls (`←` and `→`) and active slide indicators.
> - **Language & Typography**: English-only presentation utilizing Satoshi display typography, exact font weights, line heights, and letter spacings.
> - **Layout & Viewport Framing**: Full immersive experience matching the live site, including top agency header contract, ambient dark canvas (`#111111` / `#0d0d0d`), sticky 100svh stage, and trophy/badge accolades slot.

---

### 1. Overview & Core Concept

- **What It Does**: A sticky 100svh interactive awards section that transforms user scroll progress and manual arrow controls into a smooth 3D curved stack of project cards. As cards rotate and scale through 3D space along an authentic cylindrical arc, the active project's title and corresponding awards (from Awwwards, CSS Design Awards, and CSS Winner) transition into focus with optical blur and translation kinetics.
- **Target Audience**: Design critics, prospective enterprise clients, and web connoisseurs assessing high-craft digital experiences.
- **Key Value**: Delivers the tactile, high-production 3D spatial aesthetic and technical precision of Dokmeh Agency's portfolio with 60fps compositor-only performance.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Initial Arrival & Viewport Entry**: The section occupies a virtual height of `640svh` (`100 + (10 - 1) * 60 svh`) with a sticky `100svh` stage. The primary headline **"Awards"** appears bold in the upper-left quadrant (`clamp(40px, 5vw, 96px)`), counterbalanced by the Dokmeh trophy badge slot.
2. **Scroll-Driven 3D Kinematics**: As the user scrolls, the project card deck smoothly travels along a 3D curved path:
   - Lateral translation: $c = \text{sign}(l) \times (o \cdot W \cdot 0.315 + u \cdot W \cdot 0.1)$
   - Vertical parabolic offset: $g = -\text{sign}(l) \times (o \cdot H \cdot 0.215 + u \cdot H \cdot 0.034)$
   - Depth and Y-axis rotation: $Z = -10 \times \min(d, 5)\text{px}$ and $\text{rotY} = -\sin(\min(d, 1) \cdot \pi) \cdot \text{sign}(l) \cdot 48^\circ$
   - Scale factor: $1 - 0.09 \times \min(d, 1)$
3. **Step Navigation Controls**: Located at bottom-center (`left: calc(48.8% - min(12.58vw, 17.9svh))`), users can click `←` and `→` to jump directly to previous/next projects, accompanied by a clean tabular counter (`01 / 10`).
4. **Accolade Inspector**: The bottom-right quadrant displays active project details with date stamps, award provider names, recognition titles ("Special Kudos", "Site of the Day", "Star Award", "Honorable Mention"), and directional arrow links.

#### Visual Identity & Theme
- **Aesthetic Direction**: Minimalist, avant-garde digital agency aesthetic with dark architectural depth.
- **Color Palette**:
  - Background Canvas: Deep carbon black (`#0a0a0a` to `#111111`) with smooth neutral surfaces (`#1a1a1a`).
  - Text & Accents: Stark white (`#ffffff`) for active typography, muted gray (`#888888`) for unselected states and dates, subtle accent yellow (`#f7c02f`) for focus indicators.
- **Typography**: Authentic Satoshi geometric display font (700 bold and 500 medium) loaded via high-performance CDN, paired with tabular figures for dates and slide counters.

---

### 3. Key Product Decisions & Trade-Offs

- **Exact Kinematic Formula Replication**:
  - *Chosen Approach*: Implement the exact parametric curve equations extracted from Dokmeh's production bundle.
  - *Why*: Guarantees authentic card trajectory, perspective convergence, and card stacking order without guesswork.
- **Compositor-Only Transformations**:
  - *Chosen Approach*: Animate exclusively using `transform`, `opacity`, and `filter` via `requestAnimationFrame` and CSS hardware acceleration.
  - *Why*: Eliminates layout thrashing and ensures smooth 60fps performance on both mobile and desktop screens.
- **Real Project Imagery with Graceful Fallbacks**:
  - *Chosen Approach*: Load the authentic project imagery from Dokmeh's CDN with pre-generated SVG blur placeholders and resilient fallback containers.
  - *Why*: Ensures zero broken frames while delivering 100% visual fidelity to the original site.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   App Container                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Top Navigation Bar (Dokmeh Brand + Agency Links) │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Awards Section (Virtual Scroll: 640svh)          │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Sticky Stage Container (100svh)            │  │  │
│  │  │                                            │  │  │
│  │  │  [ "Awards" Header ]      [ Trophy Badges ] │  │  │
│  │  │                                            │  │  │
│  │  │         ┌───────────────────────┐          │  │  │
│  │  │         │  3D Perspective Deck  │          │  │  │
│  │  │         │   (16 Card Slots)     │          │  │  │
│  │  │         └───────────────────────┘          │  │  │
│  │  │                                            │  │  │
│  │  │  [ Project Title ]       [ Award Details ] │  │  │
│  │  │  [ ←  01 / 10  → ]       [ Date + Honors ] │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Footer / Agency Metric Summary Bar                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### Projects Data Catalog
1. **Pakshoma**: CSS Winner (Star Award, 2025-03-17), CSSDA (Special Kudos, 2025-03-06)
2. **Designex Architecture Studio**: CSSDA (Special Kudos, 2025-01-22), CSS Winner (Site of the Day, 2025-01-15)
3. **Dorr Architects**: Awwwards (Honorable Mention, 2024-09-20), CSS Winner (Site of the Day, 2024-07-17)
4. **Dokmeh Agency 2024**: Awwwards (Honorable Mention, 2024-09-11), CSSDA (Special Kudos, 2024-03-22), CSS Winner (Site of the Day, 2024-03-21)
5. **Royal Jeans**: CSS Winner (Star Award, 2024-09-11)
6. **Design KKi**: Awwwards (Honorable Mention, 2022-09-28)
7. **Dokmeh Agency 2022**: Awwwards (Honorable Mention, 2022-09-15), CSSDA (Special Kudos, 2022-09-14)
8. **Paadiran**: CSS Winner (Star Award, 2021-09-20)
9. **Khesht o Khorshid**: CSSDA (Special Kudos, 2021-09-07), CSS Winner (Site of the Day, 2021-09-01)
10. **Farho Architects**: CSS Winner (Star Award, 2020-04-06)
