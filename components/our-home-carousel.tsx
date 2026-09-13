'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Slide = {
  src: string;
  alt: string;
};

export function OurHomeCarousel({ slides }: { slides: readonly Slide[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const width = track.clientWidth;
      if (!width) return;
      const index = Math.round(track.scrollLeft / width);
      const bounded = Math.max(0, Math.min(slides.length - 1, index));
      setActive(bounded);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => track.removeEventListener('scroll', onScroll);
  }, [slides.length]);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const bounded = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: bounded * track.clientWidth, behavior: 'smooth' });
  }

  function move(direction: -1 | 1) {
    goTo(active + direction);
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-card">
        <div
          ref={trackRef}
          className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
          aria-label="Our home photo carousel"
        >
          {slides.map((slide, index) => (
            <figure key={slide.src} className="w-full shrink-0 snap-center">
              <div className="relative aspect-[3/4] w-full bg-brand-cream sm:aspect-[4/3]">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 960px"
                  className="object-contain"
                  priority={index === 0}
                />
              </div>
            </figure>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => move(-1)}
          className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-ink/85 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink md:block"
        >
          {'<'}
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => move(1)}
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-ink/85 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink md:block"
        >
          {'>'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2" aria-label="Carousel pagination">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${active === index ? 'bg-brand-primary' : 'bg-brand-ink/20 hover:bg-brand-ink/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
