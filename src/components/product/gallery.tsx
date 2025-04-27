"use client";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useProduct, useUpdateURL } from "./product-context";
import Image from "next/image";
import { GridTileImage } from "../grid/tile";
export default function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
    const {state, updateImage} = useProduct();
    const updateURL = useUpdateURL();
    const imageIndex = state.image ? parseInt(state.image):0;
    const nextImageIndex = imageIndex + 1 < images.length ? imageIndex+1: 0;
    const previousImageIndex = imageIndex === 0 ? images.length - 1: imageIndex - 1;
    const buttonClassName = "h-full px-6 transition-all ease-in-out hover:scale-110 hover:text-black dark:hover:text-white flex items-center justify-center"
    return (
    <form>
      <div className="relative h-full aspect-square max-h-[550px] w-full overflow-hidden">
        {images[imageIndex] && (
          <Image
          className="object-contain w-full h-full"
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          src={images[imageIndex]?.src as string}
          alt={images[imageIndex]?.altText as string}
          priority={true}

          />
        )}
      </div>
      {/* Show navigation arrows if there are multiple images */}
      {images.length > 1 && (
        <div className="flex justify-center w-full mt-4">
          <div className="flex items-center mx-auto border border-white rounded-full h-11 bg-neutral-50/80 text-neutral-500 backdrop-blur dark:border-black dark:bg-neutral-900/80">
            <button
              formAction={() => {
                const newState = updateImage(previousImageIndex.toString());
                updateURL(newState);
              }}
              aria-label="Previous product image"
              className={buttonClassName}
            >
              <ArrowLeftIcon className="h-5" />
            </button>
            <div className="w-px h-6 mx-1 bg-neutral-500"></div>
            <button
              formAction={() => {
                const newState = updateImage(nextImageIndex.toString());
                updateURL(newState);
              }}
              aria-label="Next product image"
              className={buttonClassName}
            >
              <ArrowRightIcon className="h-5" />
            </button>
          </div>
        </div>
      )}
      {images.length > 1 && (
        <ul className="flex items-center justify-center gap-2 py-1 my-12 overflow-auto lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === imageIndex;
            return (
              <li key={image.src} className="w-20 h-20">
                <button
                  formAction={() => {
                    const newState = updateImage(index.toString());
                    updateURL(newState);
                  }}
                  aria-label="Select product image"
                  className="w-full h-full"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    active={isActive}
                    width={80}
                    height={80}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) }
    </form>
  );
}
