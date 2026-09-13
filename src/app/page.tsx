import { Hero } from "@/components/Hero";
import { ReelStrip } from "@/components/ReelStrip";
import { Footer } from "@/components/Footer";
import { reels, videos } from "@/data/videos";

export default function Home() {
  return (
    <>
      <Hero />
      <main>
        <ReelStrip videos={videos} reels={reels} />
      </main>
      <Footer />
    </>
  );
}
