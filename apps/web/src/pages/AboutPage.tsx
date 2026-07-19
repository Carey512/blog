import { Database, Layers3, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { siteService, type AboutCard } from '../services/siteService';

const iconMap = {
  database: Database,
  layers: Layers3,
  palette: Palette,
};

export function AboutPage() {
  const { locale } = usePreferences();
  const t = messages[locale];
  const [cards, setCards] = useState<AboutCard[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadCards() {
      try {
        setLoading(true);
        setError('');
        const nextCards = await siteService.getAboutCards();

        if (alive) {
          setCards(nextCards);
        }
      } catch {
        if (alive) {
          setCards([]);
          setError('failed');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadCards();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <section className="border-b border-border pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t.nav.about}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          {t.aboutTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{t.aboutIntro}</p>
      </section>

      {loading || error ? (
        <section className="mt-8 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
          {loading ? t.loadingPosts : t.loadPostsError}
        </section>
      ) : cards.length ? (
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = iconMap[card.icon];

            return (
              <article className="rounded-lg border border-border bg-surface p-5 shadow-line" key={card.id}>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-foreground">{card.title[locale]}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{card.body[locale]}</p>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-8 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted">
          {locale === 'zh-CN' ? '暂无关于页内容。' : 'No about content yet.'}
        </section>
      )}
    </main>
  );
}
