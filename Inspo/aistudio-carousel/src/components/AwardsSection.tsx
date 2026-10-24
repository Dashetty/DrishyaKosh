import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  allAwardedProjects, 
  disciplineCategories, 
  platformCategories, 
  DisciplineCategory, 
  PlatformFilter,
  AwardedProject,
  getAwardsScrollHeight 
} from '../data/awardsData';

interface AwardsSectionProps {
  onCategoryChange?: (category: DisciplineCategory) => void;
  externalCategory?: DisciplineCategory;
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ 
  onCategoryChange,
  externalCategory 
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const detailRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<DisciplineCategory>(externalCategory || 'all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [filterMode, setFilterMode] = useState<'discipline' | 'platform'>('discipline');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Sync with external category if prop changes
  useEffect(() => {
    if (externalCategory && externalCategory !== selectedCategory) {
      setSelectedCategory(externalCategory);
      setActiveIndex(0);
    }
  }, [externalCategory, selectedCategory]);

  // Filtered projects based on active selections
  const currentProjects: AwardedProject[] = useMemo(() => {
    let list = allAwardedProjects;

    if (filterMode === 'discipline') {
      if (selectedCategory !== 'all') {
        list = list.filter((p) => p.category === selectedCategory);
      }
    } else {
      if (platformFilter !== 'all') {
        const query = platformFilter === 'awwwards' 
          ? 'awwwards' 
          : platformFilter === 'cssda' 
          ? 'css design awards' 
          : 'css winner';
        list = list.filter((p) => 
          p.awards.some((a) => a.provider.toLowerCase().includes(query))
        );
      }
    }

    return list.length > 0 ? list : allAwardedProjects;
  }, [filterMode, selectedCategory, platformFilter]);

  const totalProjects = currentProjects.length;
  const currentScrollHeight = useMemo(() => getAwardsScrollHeight(totalProjects), [totalProjects]);

  // Jump to project index smoothly
  const navigateToProject = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(totalProjects - 1, index));
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const currentScrollY = window.scrollY;
    const sectionTop = currentScrollY + rect.top;
    const sectionHeight = section.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableDistance = sectionHeight - viewportHeight;

    if (scrollableDistance <= 0) {
      setActiveIndex(clamped);
      return;
    }

    const targetScrollY = sectionTop + (clamped / (totalProjects - 1)) * scrollableDistance;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  }, [totalProjects]);

  // Handle changing category tab
  const handleSelectCategory = (cat: DisciplineCategory) => {
    setSelectedCategory(cat);
    setFilterMode('discipline');
    setActiveIndex(0);
    onCategoryChange?.(cat);
    // Smooth reset scroll to beginning of section
    const section = sectionRef.current;
    if (section) {
      const rect = section.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectPlatform = (plat: PlatformFilter) => {
    setPlatformFilter(plat);
    setFilterMode('platform');
    setActiveIndex(0);
    const section = sectionRef.current;
    if (section) {
      const rect = section.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top,
        behavior: 'smooth',
      });
    }
  };

  // Update card and text transforms based on continuous float index e
  const updateTransforms = useCallback((e: number, isReducedMotion: boolean = false) => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const isMobile = stageWidth < 768;

    const currentRoundedIndex = Math.round(e);
    setActiveIndex(currentRoundedIndex);
    setScrollProgress(totalProjects > 1 ? e / (totalProjects - 1) : 0);

    // Update 3D cards
    cardRefs.current.forEach((cardEl, s) => {
      if (!cardEl) return;
      const l = s - 6 - (isReducedMotion ? currentRoundedIndex : e);
      const d = Math.abs(l);
      const o = Math.min(d, 1);
      const u = Math.max(0, d - 1);
      const c = Math.sign(l) * (o * stageWidth * (isMobile ? 0.69 : 0.315) + u * stageWidth * 0.1);
      const g = -Math.sign(l) * (o * stageHeight * 0.215 + u * stageHeight * 0.034);
      const f = isReducedMotion ? 0 : -(Math.sin(Math.min(d, 1) * Math.PI) * Math.sign(l) * 48);

      cardEl.style.transform = `translate(-50%, -50%) translate3d(${c}px, ${g}px, ${-(10 * Math.min(d, 5))}px) rotateY(${f}deg) scale(${1 - 0.09 * Math.min(d, 1)})`;
      cardEl.style.zIndex = String(30 - Math.round(2 * d));
      cardEl.style.visibility = d > 6 ? 'hidden' : 'visible';
      cardEl.style.opacity = d > 5 ? String(Math.max(0, 1 - (d - 5))) : '1';
    });

    // Update Project Titles & Award Details
    currentProjects.forEach((_, t) => {
      const diff = t - e;
      const factor = isReducedMotion ? Number(t === currentRoundedIndex) : Math.max(0, 1 - Math.abs(diff));
      const titleEl = titleRefs.current[t];
      const detailEl = detailRefs.current[t];

      if (titleEl) {
        titleEl.style.opacity = String(factor);
        titleEl.style.filter = `blur(${isReducedMotion ? 0 : (1 - factor) * 8}px)`;
        titleEl.style.transform = `translateY(${isReducedMotion ? 0 : 12 * diff}px)`;
        titleEl.style.pointerEvents = factor > 0.5 ? 'auto' : 'none';
      }

      if (detailEl) {
        detailEl.style.opacity = String(factor);
        detailEl.style.filter = `blur(${isReducedMotion ? 0 : (1 - factor) * 6}px)`;
        detailEl.style.transform = `translateY(${isReducedMotion ? 0 : 16 * diff}px)`;
        detailEl.style.pointerEvents = factor > 0.5 ? 'auto' : 'none';
      }
    });
  }, [currentProjects, totalProjects]);

  // Main scroll and resize listener loop
  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId: number;

    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionHeight = section.scrollHeight;
      const viewportHeight = window.innerHeight;
      const totalScrollable = sectionHeight - viewportHeight;

      if (totalScrollable <= 0) {
        updateTransforms(0, isReducedMotion);
        return;
      }

      const rawProgress = -rect.top / totalScrollable;
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      const floatIndex = clampedProgress * (totalProjects - 1);
      updateTransforms(floatIndex, isReducedMotion);
    };

    const onScrollThrottled = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
    window.addEventListener('resize', onScrollThrottled);

    // Initial positioning
    handleScroll();

    // Keyboard navigation (ArrowLeft and ArrowRight)
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        navigateToProject(activeIndex + 1);
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        navigateToProject(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScrollThrottled);
      window.removeEventListener('resize', onScrollThrottled);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, navigateToProject, totalProjects, updateTransforms]);

  // Reset transforms whenever filtered category projects change
  useEffect(() => {
    updateTransforms(0);
  }, [currentProjects, updateTransforms]);

  // Card deck cards (totalProjects + 12 cards)
  const cardIndices = Array.from({ length: totalProjects + 12 }, (_, t) => t);

  return (
    <section
      ref={sectionRef}
      id="section-awards"
      className="awards-section"
      style={{ height: currentScrollHeight }}
      aria-labelledby="awards-heading"
    >
      <div ref={stageRef} className="awards-stage">
        {/* Section Heading & Category Filter Area */}
        <div className="absolute top-[6.5%] sm:top-[7.5%] left-[6%] sm:left-[9.5%] z-40 max-w-[85vw] sm:max-w-[50vw]">
          <h2 id="awards-heading" className="text-4xl sm:text-7xl font-bold tracking-tight text-neutral-900 select-none leading-none">
            Awards
          </h2>

          {/* Category Filter Tabs (Dokmeh Minimalist Design) */}
          <div className="mt-4 sm:mt-5 flex flex-col gap-2">
            {/* Filter Mode Toggle (Discipline vs Platform) */}
            <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              <span>Filter by:</span>
              <button
                onClick={() => setFilterMode('discipline')}
                className={`transition-colors cursor-pointer ${
                  filterMode === 'discipline' ? 'text-black font-bold underline underline-offset-4' : 'hover:text-black'
                }`}
              >
                Discipline
              </button>
              <span>·</span>
              <button
                onClick={() => setFilterMode('platform')}
                className={`transition-colors cursor-pointer ${
                  filterMode === 'platform' ? 'text-black font-bold underline underline-offset-4' : 'hover:text-black'
                }`}
              >
                Award Body
              </button>
            </div>

            {/* Interactive Category Chips */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1">
              {filterMode === 'discipline' ? (
                disciplineCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'all' 
                    ? allAwardedProjects.length 
                    : allAwardedProjects.filter((p) => p.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        isSelected 
                          ? 'bg-neutral-950 text-white shadow-xs' 
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`ml-1.5 text-[10px] font-mono ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })
              ) : (
                platformCategories.map((plat) => {
                  const isSelected = platformFilter === plat.id;
                  const count = plat.id === 'all'
                    ? allAwardedProjects.length
                    : allAwardedProjects.filter((p) => {
                        const q = plat.id === 'awwwards' ? 'awwwards' : plat.id === 'cssda' ? 'css design awards' : 'css winner';
                        return p.awards.some((a) => a.provider.toLowerCase().includes(q));
                      }).length;
                  return (
                    <button
                      key={plat.id}
                      onClick={() => handleSelectPlatform(plat.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        isSelected 
                          ? 'bg-neutral-950 text-white shadow-xs' 
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900'
                      }`}
                    >
                      <span>{plat.label}</span>
                      <span className={`ml-1.5 text-[10px] font-mono ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Agency Logo Slot & Global Recognition Accolade (Top Right) */}
        <div className="absolute top-[6.5%] sm:top-[7.5%] right-[6%] sm:right-[9.5%] z-40 text-right pointer-events-auto">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Dokmeh Honors
              </span>
              <span className="w-4 h-4 rounded-xs border-[2px] border-neutral-900 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-neutral-900"></span>
              </span>
            </div>
            <p className="text-[11px] leading-tight text-neutral-500 font-medium hidden sm:block max-w-[200px]">
              45+ globally recognized awards across Awwwards, CSSDA & CSS Winner
            </p>
            {/* Trophy Icons Strip */}
            <div className="flex items-center justify-end gap-3 mt-1 opacity-80 hover:opacity-100 transition-opacity">
              <img
                src="/assets/img/awards-icon-03 1.svg"
                width={80}
                height={40}
                alt="Awwwards"
                className="h-5 w-auto object-contain filter contrast-125"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <img
                src="/assets/img/awards-icon-02 1.svg"
                width={80}
                height={40}
                alt="CSS Design Awards"
                className="h-5 w-auto object-contain filter contrast-125"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* 3D Perspective Card Deck */}
        <div className="awards-cards" aria-hidden="true">
          {cardIndices.map((t) => {
            const projectIndex = (t + totalProjects - 6) % totalProjects;
            const project = currentProjects[projectIndex];
            const isCenterCard = t === 6 + activeIndex;

            if (!project) return null;

            return (
              <div
                key={`${project.id}-${t}`}
                ref={(el) => {
                  cardRefs.current[t] = el;
                }}
                className={`awards-card cursor-pointer group ${isCenterCard ? 'ring-2 ring-neutral-900/10' : ''}`}
                onClick={() => {
                  navigateToProject(projectIndex);
                }}
                title={project.title}
              >
                <div className="relative overflow-hidden rounded-md transition-shadow duration-300 group-hover:shadow-2xl">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading={t <= 12 ? 'eager' : 'lazy'}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto block select-none transform transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-box')) {
                        const box = document.createElement('div');
                        box.className = 'fallback-box w-full aspect-[4/3] bg-neutral-900 text-white flex flex-col justify-end p-5 rounded-md';
                        box.innerHTML = `<span class="text-xs uppercase tracking-widest text-neutral-400">Awarded Project</span><h4 class="text-lg font-bold">${project.title}</h4>`;
                        parent.appendChild(box);
                      }
                    }}
                  />
                  {/* Subtle glass reflection highlight */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none rounded-md" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated Project Titles (Positioned beneath center card) */}
        <div className="awards-titles" aria-hidden="true">
          {currentProjects.map((p, t) => (
            <span
              key={p.id}
              ref={(el) => {
                titleRefs.current[t] = el;
              }}
              className="block font-bold tracking-tight text-neutral-900"
            >
              {p.title}
            </span>
          ))}
        </div>

        {/* Animated Project Details & Awards List (Bottom Right) */}
        <div className="awards-details" dir="ltr">
          {currentProjects.map((p, t) => (
            <div
              key={p.id}
              ref={(el) => {
                detailRefs.current[t] = el;
              }}
              aria-hidden={t !== activeIndex}
            >
              <div className="mb-2">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">
                  {p.categoryLabel}
                </span>
              </div>
              <ul className="awards-award-list" aria-label={`${p.title} awards`}>
                {p.awards.map((award) => (
                  <li key={award.id} className="group/item">
                    <time dateTime={award.date}>{award.date}</time>
                    <p className="font-semibold text-neutral-900">
                      {award.url ? (
                        <a
                          href={award.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-black transition-colors"
                        >
                          {award.recognition} - {award.provider}
                          <img
                            src="/assets/img/awards-arrow.svg"
                            width={20}
                            height={20}
                            alt="External link"
                            className="inline-block transition-transform duration-300 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5"
                          />
                        </a>
                      ) : (
                        <span>
                          {award.recognition} - {award.provider}
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Screen Reader Live Region */}
        <p className="awards-sr-only sr-only" aria-live="polite" aria-atomic="true">
          {currentProjects[activeIndex]?.title}.{' '}
          {currentProjects[activeIndex]?.awards
            .map((e) => `${e.date}: ${e.recognition} - ${e.provider}`)
            .join('. ')}
        </p>

        {/* Step Controls (Left / Right Buttons and Tabular Slide Counter) */}
        <nav
          className="awards-controls"
          aria-label="Browse award-winning projects"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => navigateToProject(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous project"
          >
            ←
          </button>
          <span className="tabular-nums font-mono text-sm tracking-widest text-neutral-800">
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(totalProjects).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => navigateToProject(activeIndex + 1)}
            disabled={activeIndex === totalProjects - 1}
            aria-label="Next project"
          >
            →
          </button>
        </nav>

        {/* Scroll Indicator Prompt / Keyboard Hint */}
        <div className="absolute right-6 sm:right-12 bottom-6 sm:bottom-8 z-40 hidden lg:flex items-center gap-3 text-xs text-neutral-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse"></span>
          <span>Scroll down to navigate · or use ← → arrow keys</span>
          <div className="w-24 h-1 bg-neutral-200 rounded-full overflow-hidden ml-2">
            <div 
              className="h-full bg-neutral-900 transition-all duration-150 ease-out"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
