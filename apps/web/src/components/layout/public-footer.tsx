import { appCopy } from "@/content/copy";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="container flex flex-col gap-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-foreground">CityPulse</p>
          <p>{appCopy.footer.description}</p>
        </div>
        <p>{appCopy.footer.readiness}</p>
      </div>
    </footer>
  );
}
