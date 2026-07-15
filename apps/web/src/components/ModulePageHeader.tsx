export function ModulePageHeader({
  count,
  countLabel,
  eyebrow,
  intro,
  title,
}: {
  count: number;
  countLabel: string;
  eyebrow: string;
  intro: string;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-b border-border pb-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{intro}</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4 shadow-line">
        <span className="block text-3xl font-semibold text-primary">{count}</span>
        <span className="mt-1 block text-sm text-muted">{countLabel}</span>
      </div>
    </section>
  );
}
