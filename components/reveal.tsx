'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  once?: boolean;
  as?: ElementType;
};

type RevealElement = HTMLElement & { dataset: DOMStringMap };

const revealCallbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver() {
  if (sharedObserver || typeof window === 'undefined') return sharedObserver;

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        revealCallbacks.get(entry.target)?.(entry);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
  );

  return sharedObserver;
}

export function Reveal({ children, className, delayMs = 0, once = true, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current as RevealElement | null;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.classList.add('is-visible');
      return;
    }

    const observer = getSharedObserver();
    if (!observer) return;

    // Performance: shared observer + direct class mutation avoids React re-renders while scrolling.
    const callback = (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible');
        if (once) {
          observer.unobserve(element);
          revealCallbacks.delete(element);
        }
      } else if (!once) {
        element.classList.remove('is-visible');
      }
    };

    revealCallbacks.set(element, callback);
    observer.observe(element);

    return () => {
      revealCallbacks.delete(element);
      observer.unobserve(element);
    };
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
