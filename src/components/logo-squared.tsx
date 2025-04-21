import clsx from "clsx";
import LogoIcon from "./icons/logoIcon";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <div
      className={clsx(
        "flex flex-none items-center text-gray-900 justify-center border border-neutral-200 bg-white",
        {
          "h-[40px] w-[40px] rounded-xl": !size,
          "h-[30px] w-[30px] rounded-lg": size === "sm",
        }
      )}
    >
      <LogoIcon />
    </div>
  );
}
