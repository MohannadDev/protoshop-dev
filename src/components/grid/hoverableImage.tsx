"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { Image as tImage } from "@/lib/shopify/types";

interface HoverableImageProps {
  images: tImage[];
  className?: string;
}

export default function HoverableImage({
  images,
  className,
}: HoverableImageProps) {
  const [hovered, setHovered] = useState(false);

  const defaultImage = images[0];
  const hoverImage = images[1] || images[0]; // fallback to first if no second image

  // Preload hover image
  useEffect(() => {
    if (hoverImage.url !== defaultImage.url) {
      const img = new window.Image();
      img.src = hoverImage.url;
    }
  }, [hoverImage.url, defaultImage.url]);

  if (!images || images.length === 0) {
    return null; // No images to show
  }
  return (
    <div
      className={clsx(
        "relative w-full aspect-square overflow-hidden", // Ensures same aspect and size
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Default image */}
      <Image
        src={defaultImage.url}
        alt={defaultImage.altText}
        fill
        className={clsx(
          "object-contain transition-opacity duration-500 absolute inset-0 rounded-2xl",
          hovered ? "opacity-0" : "opacity-100"
        )}
        priority
        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      {/* Hover image */}
      <Image
        src={hoverImage.url}
        alt={hoverImage.altText}
        fill
        className={clsx(
          "object-contain transition-opacity duration-500 absolute inset-0 rounded-2xl",
          hovered ? "opacity-100" : "opacity-0"
        )}
        priority
        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
    </div>
  );
}
