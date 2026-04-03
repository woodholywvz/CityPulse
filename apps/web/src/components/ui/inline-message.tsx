import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const messageVariants = cva(
  "rounded-[1.5rem] border px-4 py-3 text-sm leading-6",
  {
    variants: {
      variant: {
        info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-900 dark:text-cyan-100",
        warning: "border-amber-400/30 bg-amber-400/10 text-amber-950 dark:text-amber-100",
        success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-950 dark:text-emerald-100",
        error: "border-red-400/30 bg-red-400/10 text-red-950 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

type InlineMessageProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageVariants>;

export function InlineMessage({
  className,
  variant,
  ...props
}: InlineMessageProps) {
  return <div className={cn(messageVariants({ variant }), className)} {...props} />;
}
