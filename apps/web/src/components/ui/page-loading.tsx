type PageLoadingProps = Readonly<{
  title: string;
}>;

export function PageLoading({ title }: PageLoadingProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-soft backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">{title}</p>
        <div className="mt-6 h-4 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-[1.75rem] border border-border/70 bg-card/70 shadow-soft"
          />
        ))}
      </div>
    </section>
  );
}
