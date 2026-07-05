"use client";

import { useEffect, useState } from "react";
import { ImageSquare } from "@phosphor-icons/react";

interface Props {
  images: { url: string; descripcion: string }[];
}

export default function Carousel({ images }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => setIdx((p) => (p + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center gap-2 rounded-xl bg-gray-100 text-gray-400">
        <ImageSquare size={22} />
        <span className="text-sm">Sin imagenes en carrusel</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-100">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {images.map((img, i) => (
          <div key={i} className="min-w-0 shrink-0 basis-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.descripcion} className="h-48 w-full object-contain sm:h-64 md:h-80" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`cursor-pointer rounded-full transition-all duration-300 ease-out ${i === idx ? "w-6 bg-white" : "w-2.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
