import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase",
  {
    variants: {
      variant: {
        default: "border-border bg-card/80 text-muted-foreground",
        primary: "border-primary/20 bg-primary/10 text-primary",
        accent: "border-cyan-400/20 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
        subtle: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
