import { cn } from "@/lib/utils";

type EmptyStateProps = Readonly<{
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}>;

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-border/70 bg-card/80 p-8 text-center shadow-soft backdrop-blur",
        className,
      )}
    >
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}
