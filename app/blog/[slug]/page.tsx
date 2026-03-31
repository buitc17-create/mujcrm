import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ShareButtons from '../components/ShareButtons';
import {
  posts,
  getPostBySlug,
  getRelatedPosts,
  categoryColors,
  calculateReadTime,
  slugifyHeading,
  type ContentBlock,
} from '../data/posts';

const BASE_URL = 'https://mujcrm.vercel.app';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `${BASE_URL}/blog/${post.slug}`;
  const desc = post.perex.slice(0, 160);
  return {
    title: post.title,
    description: desc,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} | MujCRM Blog`,
      description: desc,
      url,
      type: 'article',
      locale: 'cs_CZ',
      publishedTime: post.dateISO,
      modifiedTime: post.dateISO,
      authors: ['MujCRM s.r.o.'],
      tags: post.keywords,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: desc },
  };
}

function renderBlock(block: ContentBlock, i: number) {
  switch (block.type) {
    case 'h2': {
      const id = slugifyHeading(block.text);
      return (
        <h2 key={i} id={id} className="text-xl sm:text-2xl font-bold text-white mt-10 mb-4 scroll-mt-24">
          {block.text}
        </h2>
      );
    }
    case 'h3':
      return (
        <h3 key={i} className="text-lg font-bold mt-7 mb-3" style={{ color: 'rgba(237,237,237,0.9)' }}>
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p key={i} className="text-base leading-relaxed" style={{ color: 'rgba(237,237,237,0.7)' }}>
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={i} className="flex flex-col gap-2 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.7)' }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00BFFF' }} />
              {item}
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={i} className="flex flex-col gap-2 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.7)' }}>
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(0,191,255,0.15)', color: '#00BFFF' }}
              >
                {j + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div key={i} className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,191,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {block.headers.map((h, j) => (
                  <th key={j} className="text-left px-4 py-3 font-bold" style={{ color: 'rgba(237,237,237,0.85)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr
                  key={j}
                  style={{
                    borderBottom: j < block.rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                    background: j % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  }}
                >
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-3" style={{ color: k === 0 ? 'rgba(237,237,237,0.85)' : 'rgba(237,237,237,0.55)' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'callout':
      return (
        <div
          key={i}
          className="rounded-xl px-5 py-4 text-sm leading-relaxed flex gap-3"
          style={{
            background: (block.accent ?? '#00BFFF') + '0e',
            border: `1px solid ${block.accent ?? '#00BFFF'}25`,
            color: 'rgba(237,237,237,0.7)',
          }}
        >
          <span
            className="flex-shrink-0 w-1 rounded-full self-stretch"
            style={{ background: block.accent ?? '#00BFFF' }}
          />
          {block.text}
        </div>
      );
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const catColor = categoryColors[post.category] ?? '#00BFFF';
  const url = `${BASE_URL}/blog/${post.slug}`;
  const readTime = calculateReadTime(post.content);
  const related = getRelatedPosts(post.slug, 3);

  // Extract H2 headings for TOC
  const toc = post.content
    .filter((b): b is { type: 'h2'; text: string } => b.type === 'h2')
    .map((b) => ({ text: b.text, id: slugifyHeading(b.text) }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.perex,
    author: { '@type': 'Organization', name: 'MujCRM s.r.o.' },
    publisher: { '@type': 'Organization', name: 'MujCRM', url: BASE_URL },
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    url,
    inLanguage: 'cs',
    wordCount: post.content
      .filter((b): b is { type: 'p'; text: string } => b.type === 'p')
      .reduce((acc, b) => acc + b.text.split(/\s+/).length, 0),
    keywords: post.keywords.join(', '),
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="flex-1 w-full px-6 py-16">
        <div className="max-w-5xl mx-auto w-full">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-10" style={{ color: 'rgba(237,237,237,0.4)' }}>
            <a href="/" className="link-muted">Domů</a>
            <span>/</span>
            <a href="/blog" className="link-muted">Blog</a>
            <span>/</span>
            <span style={{ color: 'rgba(237,237,237,0.7)' }}>{post.category}</span>
          </nav>

          {/* Article header */}
          <div className="mb-10 max-w-3xl">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
              style={{ background: catColor + '18', color: catColor, border: `1px solid ${catColor}35` }}
            >
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-5">
              {post.title}
            </h1>
            <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(237,237,237,0.55)' }}>
              {post.perex}
            </p>

            {/* Meta row */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {readTime} min čtení
                </span>
                <span>MujCRM redakce</span>
              </div>
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>

          {/* Body: TOC sidebar + content */}
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-14 lg:items-start">

            {/* TOC — sticky sidebar on desktop */}
            {toc.length > 0 && (
              <aside className="hidden lg:block sticky top-24">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(237,237,237,0.35)' }}>
                  Obsah článku
                </p>
                <nav className="flex flex-col gap-1">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="toc-link text-xs leading-relaxed py-1 px-3 rounded-lg block"
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </aside>
            )}

            {/* Article content */}
            <div>
              {/* Mobile TOC */}
              {toc.length > 0 && (
                <div
                  className="lg:hidden rounded-xl p-5 mb-8"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(237,237,237,0.35)' }}>
                    Obsah článku
                  </p>
                  <nav className="flex flex-col gap-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="text-xs py-1 block link-muted"
                      >
                        → {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Main content blocks */}
              <div className="flex flex-col gap-5">
                {post.content.map((block, i) => renderBlock(block, i))}
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="mt-16 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(237,237,237,0.35)' }}>
                    Související články
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {related.map((rel) => {
                      const relColor = categoryColors[rel.category] ?? '#00BFFF';
                      const relTime = calculateReadTime(rel.content);
                      return (
                        <a
                          key={rel.slug}
                          href={`/blog/${rel.slug}`}
                          className="related-card rounded-xl p-4 flex flex-col gap-2"
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{ color: relColor }}
                          >
                            {rel.category}
                          </span>
                          <p className="text-sm font-semibold text-white leading-snug">
                            {rel.title}
                          </p>
                          <span className="text-xs mt-auto" style={{ color: 'rgba(237,237,237,0.35)' }}>
                            {relTime} min čtení →
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div
                className="mt-12 rounded-2xl p-10 text-center"
                style={{ background: 'rgba(0,191,255,0.04)', border: '1px solid rgba(0,191,255,0.1)' }}
              >
                <h2 className="text-xl font-bold text-white mb-2">
                  Vyzkoušejte MujCRM zdarma →
                </h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.5)' }}>
                  7 dní bez platební karty. Nastavení za 5 minut.
                </p>
                <a href="/onboarding" className="btn-cyan inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold">
                  Začít zdarma
                </a>
              </div>

              {/* Back link */}
              <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <a href="/blog" className="link-back inline-flex items-center gap-2 text-sm font-medium">
                  ← Zpět na blog
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
