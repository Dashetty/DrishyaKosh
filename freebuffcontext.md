TicketFrame deck variant done. Now the engine — ReelCarousel.tsx:

Wait, mistakes to fix in what I just wrote:

<blockquote_mark aria-hidden /> — that's not a thing; invalid JSX element. Remove it (I meant the decorative «"» like TicketFrame uses a span). Remove that line.
Nested <div key> wrapping .deg-note — source structure needed inner absolute positioning via .awards-details > div { position:absolute; inset:0 } — each item must be the direct child of the .deg-notes container for absolute stacking. I wrapped note div inside another div — the CSS selector .deg-notes > div would target the wrapper; the note inside needs positioning. Simplify: put ref/class on the direct child and drop the wrapper. Fix: outer
directly.
category={category ?? undefined} — TicketFrame category prop is required Category (not optional). Must pass a real category. videos have video.category slug; no Category object → build one: don't use prop; TicketFrame only displays spine text (number/title). In the deck the spine already says CATEGORY n; for P2 "all categories" the ticket's spine shows its own category anyway (correct!). Best: TicketFrame uses video.category to look up the spine label internally — it already does spine = CATEGORY_SPINE[video.category] and displays category.number/title from prop. Since prop is required in deck/strip, and ReelStrip passes the matching category — for the carousel, videos come from ONE category in P3; in P2 they're mixed. RID right: make TicketFrame derive label from a Categories list? Simplest: add catalog lookup: pass category prop as optional and TicketFrame resolves via categories.find(c => c.slug === video.category) if prop absent. Edit TicketFrame: import not needed (types only) — import { categories } from "@/data/videos"? components importing data — ReelStrip does import from data? It receives via props. Circular import risk: data/videos doesn't import TicketFrame — fine. But cleaner: make TicketFrame prop optional with fallback categories. Hmm — data-in-component is meh but pragmatic; alternatively ReelCarousel builds const catBySlug map from data. Choose: TicketFrame keeps required prop? P2 passes... I'd rather change TicketFrame: category optional; when undefined, resolve categories.find(c => c.slug === video.category). Keep strip passing its category (it maps anyway). Carousel passes undefined → each ticket shows its own category chip.
titleEl/noteEl refs on titles: I set className "deg-title" on span inside .deg-titles — CSS: .deg-titles span absolute inset 0 (source). My CSS will target .deg-title directly.
slotRef callback with keying: refs arrays re-filled each render — fine.
videos[activeIndex] live region — good. But .sr-only class exists? Tailwind provides sr-only utility. OK.
WatchModal prop signature — ReelStrip uses <WatchModal video={watching} onClose={...} />. Same. Good.
aria-label heading on section: ok.
chip shows "ALL CATEGORIES · 12 REELS" — hardcoded 12; must be dynamic: videos.length. Fix: ALL CATEGORIES · ${total} REELS.
In P2, category prop optional in ReelCarousel ({category = null}) — TicketFrame doesn't need it once I fix #3.
Fix TicketFrame category optional + smart resolve; fix ReelCarousel issues. Then CSS.

Fixing three flaws I just wrote — invalid blockquote_mark element, note item nesting (must be direct children for absolute stacking), category prop handling (deck tickets show their own category chip), and a hardcoded count:

Now make TicketFrame's category optional with a self-lookup fallback (deck tickets show their own category):
