/**
 * Smooth Scroll Hook — Lenis Integration
 *
 * Provides buttery-smooth scrolling for the entire page.
 * Import and call in root or layout component.
 *
 * Usage:
 *   import { useSmoothScroll } from "~/hooks/use-smooth-scroll";
 *   useSmoothScroll(); // Call in layout component
 */

import { useEffect } from "react";

export function useSmoothScroll(options?: {
  duration?: number;
  easing?: (t: number) => number;
  smoothWheel?: boolean;
}) {
  useEffect(() => {
    let lenis: any;
    let rafId: number;

    async function init() {
      const Lenis = (await import("@studio-freight/lenis")).default;

      lenis = new Lenis({
        duration: options?.duration ?? 1.2,
        easing:
          options?.easing ?? ((t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
        smoothWheel: options?.smoothWheel ?? true,
      });

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    }

    init();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);
}
