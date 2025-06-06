import clsx from "clsx";

const dots = "mx-[1px] inline-block h-1 w-1 animate-blink rounded-md";

const LoadingDots = ({ className }: { className: string }) => {
  return (
    <span className="inline-flex items-center mx-2">
      <span className={clsx(dots, className)} />
      <span className={clsx(dots, "animation-delay-[200ms]", className)} />
      <span className={clsx(dots, "animation-delay-[400ms]", className)} />
    </span>
  );
};

export default LoadingDots;