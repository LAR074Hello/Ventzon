"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * An <img> that fades in as it loads: the frame shows a warm dark
 * placeholder, then the photograph settles from a barely-there zoom.
 * No pop, no flash — the same long, expensive ease as everything else
 * on the marketing site. Cached images show immediately.
 */
export default function FadeImage({
  className = "",
  alt,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Already in the cache by the time React hydrates? Show immediately.
    const el = ref.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    // Plain <img> is deliberate: the load fade needs onLoad + CSS class
    // control, which next/image's <Image> doesn't expose for remote
    // Unsplash sources already pre-sized with ?w= params.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      className={`fade-image ${loaded ? "is-loaded" : ""} ${className}`}
      onLoad={() => setLoaded(true)}
      {...rest}
    />
  );
}
