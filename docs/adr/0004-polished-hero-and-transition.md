# ADR-0004: Polished Hero Experience and Professional Visual Treatment

**Status**: Proposed · **Date**: 2026-09-16 · **Supersedes**: nothing

## Context

The current implementation feels unfinished and "slopy" rather than professional. User feedback compares it unfavorably to siena.film, which achieves polish through:

- **Restrained elegance over maximal animation** — siena.film uses subtle, purposeful transitions
- **Clean visual hierarchy** — generous whitespace, muted palette, clear typography
- **Consistent polish** — every element feels "of a piece" rather than individually animated pieces

The current issues:
1. Hero section feels generic — title + subtitle without personal presence
2. The drum roll transition works technically but feels disconnected from the hero
3. Visual texture (grain, sprockets) competes with content rather than enhancing it
4. The loader animation (thread/projector) is charming but feels like placeholder tech-showcase

The goal: elevate the entire experience to feel like a **professional film portfolio** presenting curated work, not a technical demo.

## Decision

### 1. Refined Hero Section — "Portrait as Curator"

The hero becomes a **curator portrait** that introduces both the archive and the person behind it:

- **Before any content animation**, the hero presents a simple, centered title
- **Name/photo overlay** appears subtly (not as separate floating element) — either integrated into the title design or as a small icon/avatar near the name
- **Tagline** remains: "A personal archive of moving pictures — handpicked, not algorithmic"
- **Scroll cue** stays (polite, not pushy) — a small animated dot indicator

The hero's animation sequence:
1. Fade-in the wordmark "Drishyakosh" (clean, no bounce)
2. Fade-in the name "Hardeep Dilip Shetty" as a subtitle
3. Fade-in the tagline
4. Show scroll cue (or reveal on hover)

### 2. Transition to Drum Roll — "Opening the Canister"

The hero-to-drum transition becomes a **film gate opening** metaphor:

- **The sentinel** (viewport-height section) enters from the bottom
- **The Drum Stage** crossfades in with a subtle scale-up (0.98 → 1.0) and opacity ramp
- **No additional animation** on the hero elements during this transition — they simply fade out as the drum fades in
- **The Intertitle** of Reel 01 appears with a gentle lift ( GSAP from { y: 16, opacity: 0 } to { y: 0, opacity: 1 } with 0.7s ease)

This creates a clean handoff:
```
Hero (static presentation) 
  → scroll into sentinel 
  → Drum Stage crossfades in (opacity ramp)
  → Intertitle lifts into view
```

### 3. Visual Treatment — Film Archive Aesthetic

**Color palette** (updated from current):
- Base: `#0a0908` (ink black)
- Text: `#f5f1e9` (bone, warm off-white)
- Accent: `#c7a262` (amber, muted gold)
- Dim text: `#6b685f` (smoke, desaturated)

**Typography** (simplified):
- Wordmark: Maghfirea, large caps
- Intertitles: Maghfirea, elegant spacing
- Body/credits: NeueBrucke, clean sans-serif

**Texture treatment** (subtle):
- Grain: Apply at 2-3% opacity, fixed (not animated), only visible on hover or at screen edges
- Sprockets: Small, unobtrusive perforation dots at top/bottom of viewport — not crawling, just present
- Light leak: Replace with a single, subtle radial gradient that doesn't drift

### 4. Loader/Intro Experience

Keep the "thread the projector" metaphor but simplify:

1. **Beam rises** vertically (0 → full height)
2. **Wordmark appears** at beam center
3. **Fade to content** — no complex clipping animations
4. **Click-to-skip** remains

This feels like a **projector warming up** rather than a tech demo.

### 5. Drum Roll Presentation — Professional, Not Novelty

The drum mechanics remain, but the presentation feels curated:

- **No visible "physics" indicators** — velocity blur is subtle, speed-dependent, not constant
- **Parallax layers**: Keep the siena rates but ease animations to feel natural
- **WATCH button**: Magnetic hover, but subtle (no bouncing)
- **HUD**: Minimal — just the catalog number and title, positioned unobtrusively
- **Rail tabs**: Active state is a soft underline or subtle color change, not a bold tab bar

### 6. Mobile Considerations

- Grain/sprockets hidden on small screens
- Parallax simplified (as per ADR-0002)
- Tap-to-reveal curator notes below frames
- Vertical swipe for drum navigation

## Consequences

**Positive:**
- Professional portfolio feel — showcases curation skill, not just technical capability
- Cleaner visual language — elements feel "of a piece"
- Better focus on the videos themselves (the actual content)

**Negative:**
- Requires design iteration on the hero (photo/name integration)
- Grain/sprockets/light leak need toning back
- Loader animation needs simplification

**Neutral:**
- The technical drum mechanics remain unchanged — only the presentation layer evolves
- All existing ADRs (0001-0003) remain valid

## Implementation Checklist

- [ ] Update Hero.tsx with refined presentation
- [ ] Reduce grain opacity and make static
- [ ] Simplify loader animation in LoadingScreen.tsx
- [ ] Update globals.css with new color variables
- [ ] Fine-tune drum stage crossfade (already partially done)
- [ ] Update Intertitle.tsx animation
- [ ] Review and simplify DrumRail.tsx visual design