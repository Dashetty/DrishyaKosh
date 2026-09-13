import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/lib/smooth-scroll";
import { Grain } from "@/components/Grain";
import { Sprockets } from "@/components/Sprockets";
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
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  colorScheme: "dark",
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
      </head>
      <body className="min-h-full overflow-x-clip">
        <SmoothScroll>
          <Grain />
          <Sprockets />
          <Cursor />
          <LoadingScreen />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
