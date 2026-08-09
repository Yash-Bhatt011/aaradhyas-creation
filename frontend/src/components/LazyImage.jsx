import React, { useState } from "react";

/**
 * Drop-in replacement for <img> that shows a shimmering skeleton placeholder
 * until the image has actually loaded, and lazy-loads offscreen images.
 *
 * Usage: <LazyImage src={url} alt="..." className="..." aspect="3/4" />
 */
export default function LazyImage({
  src,
  alt = "",
  className = "",
  style = {},
  aspect,        // e.g. "3/4", "4/5", "1/1" — reserves space to prevent layout shift
  eager = false, // set true for above-the-fold hero images
  onLoad,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <span
      className={`lazy-img-wrap ${className}`}
      style={{ aspectRatio: aspect || undefined, ...style }}
    >
      {!loaded && !errored && <span className="lazy-img-skeleton" />}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={`lazy-img-real ${loaded ? "loaded" : ""}`}
          onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
          onError={() => setErrored(true)}
          {...rest}
        />
      )}
      {errored && (
        <span className="lazy-img-fallback">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="9" cy="9" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </span>
      )}
    </span>
  );
}
