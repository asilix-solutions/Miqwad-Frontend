/**
 * @file useInViewport.ts
 * @description Minimal IntersectionObserver hook — lazy-mounts an address
 * card's mini-map only once it nears the viewport, then keeps it mounted.
 * Feature-scoped: only the address card grid needs this today.
 */
import { useEffect, useRef, useState } from "react";

export function useInViewport<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView || !ref.current) return;
    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
