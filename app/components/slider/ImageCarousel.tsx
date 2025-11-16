"use client";

import React from "react";
import { useKeenSlider } from "keen-slider/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  height?: number;
  rounded?: string;
  interval?: number; // autoplay interval in ms
}

export default function ImageCarousel({
  images,
  height = 420,
  rounded = "rounded-xl",
  interval = 3000,
}: ImageCarouselProps) {
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: "snap",
    slides: { perView: 1, spacing: 0 },
  });

  // AUTOPLAY INTERVAL
  React.useEffect(() => {
    if (!slider) return;

    const autoplay = setInterval(() => {
      slider.current?.next();
    }, interval);

    return () => clearInterval(autoplay);
  }, [slider, interval]);

  return (
    <div className="relative w-full">
      {/* Slider */}
      <div
        ref={sliderRef}
        className={`keen-slider overflow-hidden ${rounded}`}
        style={{ height }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="keen-slider__slide flex items-center justify-center"
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* BUTTON PREV */}
      <button
        onClick={() => slider.current?.prev()}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white shadow p-2 rounded-full transition"
      >
        <ChevronLeft size={22} />
      </button>

      {/* BUTTON NEXT */}
      <button
        onClick={() => slider.current?.next()}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white shadow p-2 rounded-full transition"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
