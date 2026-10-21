import { Hero } from "@/components/Hero";
import { SiteNav } from "@/components/SiteNav";
import { ReelStrip } from "@/components/ReelStrip";
import { Footer } from "@/components/Footer";
import { reels, videos } from "@/data/videos";

export default function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <main>
        <ReelStrip videos={videos} reels={reels} />
      </main>
      <Footer />
    </>
  );
}
