import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-36 w-full rounded-[1.5rem] border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
