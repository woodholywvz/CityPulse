import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminSurfaceProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function AdminSurface({ children, className }: AdminSurfaceProps) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-5 shadow-soft backdrop-blur xl:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

type AdminSectionHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}>;

export function AdminSectionHeader({
  eyebrow,
  title,
  body,
  action,
}: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 font-display text-2xl font-semibold text-white">{title}</h2>
        {body ? <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

type AdminMetricCardProps = Readonly<{
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "primary";
}>;

export function AdminMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: AdminMetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-[1.5rem] border p-4",
        tone === "accent" && "border-cyan-300/20 bg-cyan-300/8",
        tone === "primary" && "border-emerald-300/20 bg-emerald-300/8",
        tone === "default" && "border-white/10 bg-white/5",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p> : null}
    </article>
  );
}

type AdminStatusBadgeProps = Readonly<{
  label: string;
  tone?: "subtle" | "primary" | "accent";
}>;

export function AdminStatusBadge({
  label,
  tone = "subtle",
}: AdminStatusBadgeProps) {
  return <Badge variant={tone}>{label}</Badge>;
}

type AdminKeyValueGridProps = Readonly<{
  items: Array<{ label: string; value: React.ReactNode }>;
  columns?: 2 | 3 | 4;
}>;

export function AdminKeyValueGrid({
  items,
  columns = 2,
}: AdminKeyValueGridProps) {
  const gridClassName =
    columns === 4
      ? "sm:grid-cols-2 2xl:grid-cols-4"
      : columns === 3
        ? "sm:grid-cols-2 2xl:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <div className={cn("grid gap-3", gridClassName)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3"
        >
          <p className="break-words text-xs uppercase tracking-[0.2em] text-slate-400">
            {item.label}
          </p>
          <div className="mt-2 break-words text-sm leading-6 text-slate-100">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
