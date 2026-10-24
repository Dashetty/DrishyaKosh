import React, { useRef } from 'react';
import { Header } from './components/Header';
import { AwardsSection } from './components/AwardsSection';
import { featuredAwardedProjects } from './data/awardsData';

export default function App() {
  const awardsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToAwards = () => {
    const el = document.getElementById('section-awards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#f7c02f] selection:text-black">
      {/* Top Navigation Bar */}
      <Header onScrollToAwards={scrollToAwards} />

      {/* Main Experience */}
      <main className="w-full">
        {/* Intro Teaser Strip */}
        <section className="pt-28 pb-6 px-6 sm:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-100 max-w-[1440px] mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-widest uppercase text-neutral-500">
              <span>Dokmeh Agency</span>
              <span>·</span>
              <span>Accolades & Recognition</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950 max-w-xl text-balance">
              Recognized craft on the world's most demanding digital stages.
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 text-xs font-medium text-neutral-600">
            <div>
              <span className="block text-2xl font-bold text-neutral-950 tabular-nums">45+</span>
              <span className="text-neutral-500">International Awards</span>
            </div>
            <div className="h-8 w-px bg-neutral-200 hidden sm:block"></div>
            <div>
              <span className="block text-2xl font-bold text-neutral-950 tabular-nums">10+</span>
              <span className="text-neutral-500">Countries Served</span>
            </div>
            <div className="h-8 w-px bg-neutral-200 hidden sm:block"></div>
            <div>
              <span className="block text-2xl font-bold text-neutral-950 tabular-nums">15+</span>
              <span className="text-neutral-500">Years of Craft</span>
            </div>
            <button
              onClick={scrollToAwards}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-full font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Explore 3D Stack</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </section>

        {/* Reconstructed Pixel-Perfect Awards Section */}
        <div ref={awardsContainerRef}>
          <AwardsSection />
        </div>

        {/* Post-Awards Catalog & Agency Summary */}
        <section className="py-24 px-6 sm:px-12 border-t border-neutral-200 bg-neutral-50/50">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-neutral-500 mb-2">
                  Complete Archive
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-950">
                  Featured Awarded Works
                </h3>
              </div>
              <p className="text-sm text-neutral-500 max-w-md">
                A selection of digital identities, web applications, and immersive brand experiences crafted by Dokmeh Agency.
              </p>
            </div>

            {/* Grid of awarded projects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {featuredAwardedProjects.map((p, idx) => (
                <div
                  key={p.id}
                  className="group bg-white rounded-lg p-3 border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-neutral-100 mb-3">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white rounded">
                      #{String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition-colors">
                      {p.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                      {p.awards[0]?.recognition} · {p.awards[0]?.provider}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-mono">{p.awards[0]?.date}</span>
                    <button
                      onClick={() => {
                        scrollToAwards();
                        // give time to scroll to section, then scroll directly
                        setTimeout(() => {
                          const section = document.getElementById('section-awards');
                          if (section) {
                            const rect = section.getBoundingClientRect();
                            const top = window.scrollY + rect.top;
                            const scrollDist = section.scrollHeight - window.innerHeight;
                            const target = top + (idx / (featuredAwardedProjects.length - 1)) * scrollDist;
                            window.scrollTo({ top: target, behavior: 'smooth' });
                          }
                        }, 400);
                      }}
                      className="text-neutral-900 font-semibold hover:underline cursor-pointer"
                    >
                      View in 3D →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-10 px-6 sm:px-12 bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-xs border-[2px] border-black flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-black"></span>
            </span>
            <span className="font-bold text-neutral-900 uppercase">Dokmeh Agency</span>
            <span>· All rights reserved</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://hidokmeh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-950 transition-colors"
            >
              Official Website: hidokmeh.com
            </a>
            <a
              href="https://www.awwwards.com/dokmeh/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-950 transition-colors"
            >
              Awwwards Profile
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
