import PageBackground from '../ui/PageBackground';
import SiteHeader from '../ui/SiteHeader';
import Footer from '../home/Footer';

export function Section({ title, children }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="font-display text-xl font-semibold tracking-tight text-zinc-50">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

export function List({ children }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-zinc-600">{children}</ul>;
}

export function TextLink({ href, children }) {
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="text-zinc-200 underline underline-offset-2 transition-colors hover:text-white"
    >
      {children}
    </a>
  );
}

export default function LegalPage({ title, updated, children }) {
  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-zinc-950">
      <PageBackground />
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-6 pb-10 pt-10 md:px-8 md:pt-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-zinc-400">Last updated: {updated}</p>
          <div className="mt-8">{children}</div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
