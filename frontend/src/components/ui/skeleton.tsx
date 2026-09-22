import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#162035]/60 border border-[#1a2333]/40",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
