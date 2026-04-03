import { cn } from "@/lib/utils";

type FieldProps = Readonly<{
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}>;

export function Field({ label, description, error, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
      <p
        className={cn(
          "min-h-5 text-sm",
          error ? "text-red-600 dark:text-red-300" : "text-transparent",
        )}
      >
        {error ?? "\u00A0"}
      </p>
    </label>
  );
}
