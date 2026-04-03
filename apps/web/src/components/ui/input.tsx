import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
