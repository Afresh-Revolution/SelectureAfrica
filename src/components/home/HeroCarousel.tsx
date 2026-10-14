"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./HeroCarousel.module.scss";

const SLIDES = [
  {
    src: "/hero/search.jpg",
    alt: "Two professionals reviewing a printed shortlist during an executive search briefing",
  },
  {
    src: "/hero/counsel.jpg",
    alt: "A consultant holding a candidate brief with two colleagues in a senior hiring conversation",
  },
  {
    src: "/hero/arrival.jpg",
    alt: "An African professional arriving at a London office for a senior appointment",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className={styles.stage}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.frame}>
        {SLIDES.map((slide, slideIndex) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={slideIndex === 0}
            sizes="(max-width: 900px) 80vw, 440px"
            className={`${styles.slide} ${slideIndex === index ? styles.active : ""}`}
          />
        ))}
      </div>
      <div className={styles.dots} role="tablist" aria-label="Featured photographs">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show photograph ${slideIndex + 1}`}
            className={slideIndex === index ? styles.dotOn : styles.dot}
            onClick={() => setIndex(slideIndex)}
          />
        ))}
      </div>
    </div>
  );
}
