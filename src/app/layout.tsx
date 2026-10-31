import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/lib/smooth-scroll";
import { Grain } from "@/components/Grain";
import { Cursor } from "@/components/Cursor";
import { LoadingScreen } from "@/components/LoadingScreen";

const title = "DrishyaKosh — A Personal Archive of Moving Pictures";
const description =
  "Handpicked, not algorithmic. A curated film archive of YouTube videos, presented as one continuous reel — curated by Hardeep Dilip Shetty.";

const siteUrl = (() => {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
})();

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any", type: "image/x-icon" },
      ...[16, 32, 48, 64, 128, 192, 512].map((size) => ({
        url: `/favicons/favicon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
      })),
    ],
    apple: {
      url: "/favicons/favicon-180x180.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
};

export const viewport: Viewport = {
  // #0d0a07 is the sRGB equivalent of --color-ink (oklch(0.148 0.009 65));
  // metadata parsers expect a plain hex
  themeColor: "#0d0a07",
  colorScheme: "dark",
  // cover viewports report real env(safe-area-inset-*) values — without it
  // the fixed-chrome insets (the mark, the loader's skip button) read 0
  // and do nothing. The page is edge-to-edge ink, so bleeding under the
  // notch is harmless.
  viewportFit: "cover",
};

/** Runs before first paint: flags the intro for this session only. */
const introFlagScript = `try{if(!sessionStorage.getItem("dk-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-pending")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introFlagScript }} />
        <link
          rel="preload"
          href="/fonts/maghfirea.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Hero wordmark (LCP) — preloaded alongside the Prelude face so the
            font-display: block wall lifts on the first paint of the LCP text */}
        <link
          rel="preload"
          href="/fonts/Unbounded-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Loading screen faces + mask art — all tiny, and the overlay is the
            first thing painted, so none of it may arrive late */}
        <link
          rel="preload"
          href="/fonts/brahmos-bold-digits.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/brahmos-devanagari-medium-subset.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/loader/mark-chest.svg"
          as="image"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/loader/mark-ring.svg"
          as="image"
          crossOrigin="anonymous"
        />
        {/* Trailing content domains — ticket thumbnails (ytimg) and the
            watch lightbox's embed (youtube-nocookie). */}
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      </head>
      <body className="min-h-full overflow-x-clip">
        <SmoothScroll>
          <Grain />
          <Cursor />
          <LoadingScreen />
          <div id="page-content">{children}</div>
        </SmoothScroll>
      </body>
    </html>
  );
}
