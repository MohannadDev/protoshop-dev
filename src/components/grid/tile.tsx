import clsx from "clsx";
import Image from "next/image";
import Label from "../label";
import { Image as tImage } from "@/lib/shopify/types";
import HoverableImage from "./hoverableImage";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  images,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  images?: tImage[];
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
} & React.ComponentProps<typeof Image>) {
  return (
    <div
      className={clsx(
        "group flex h-full w-full items-center justify-center overflow-hidden border bg-[rgb(235,235,235)] hover:border-blue-600 dark:bg-black",
        {
          relative: label,
          "border-2 border-blue-600": active,
          "border-neutral-200 dark:border-neutral-800": !active,
        }
      )}
    >
      {props.src && (images?.length ?? 0) > 1 ? (
        <HoverableImage
          images={images ?? []}
          className={clsx(" relative h-[90%] w-full h-md object-contain aspect-square", {
            "transition duration-300 ease-in-out group-hover:scale-105":
              isInteractive,
          })}
          {...props}
        />
      ) : (
        props.src && (
          <Image
            className={clsx(" relative h-[90%] w-full object-contain aspect-square", {
              "transition duration-300 ease-in-out group-hover:scale-105 ":
                isInteractive,
            })}
            {...props}
            alt={props.alt ?? "Product Image"}
          />
        )
      )}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
