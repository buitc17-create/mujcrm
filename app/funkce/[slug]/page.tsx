import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { features, getFeatureBySlug } from '../data';

const BASE_URL = 'https://www.mujcrm.cz';

export function generateStaticParams() {
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};

  const url = `${BASE_URL}/funkce/${feature.slug}`;
  return {
    title: feature.metaTitle,
    description: feature.description,
    keywords: feature.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: feature.metaTitle,
      description: feature.description,
      url,
      type: 'website',
      locale: 'cs_CZ',
      siteName: 'MujCRM',
    },
    twitter: {
      card: 'summary_large_image',
      title: feature.metaTitle,
      description: feature.description,
    },
  };
}

export default async function FeaturePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  const url = `${BASE_URL}/funkce/${feature.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'MujCRM', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Funkce', item: `${BASE_URL}/#funkce` },
          { '@type': 'ListItem', position: 3, name: feature.title, item: url },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: feature.metaTitle,
        description: feature.description,
        inLanguage: 'cs',
        about: {
          '@type': 'SoftwareApplication',
          name: 'MujCRM',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '299',
            priceCurrency: 'CZK',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '299',
              priceCurrency: 'CZK',
              unitText: 'MONTH',
            },
          },
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: feature.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
              style={{
                background: `radial-gradient(ellipse, ${feature.accent}12 0%, transparent 70%)`,
                filter: 'blur(60px)',
              }}
            />
          </div>

          <div className="relative max-w-3xl mx-auto text-center">
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center gap-1.5 text-xs mb-8" style={{ color: 'rgba(237,237,237,0.35)' }}>
              <Link href="/" className="hover:text-white transition-colors">Domů</Link>
              <span>/</span>
              <Link href="/#funkce" className="hover:text-white transition-colors">Funkce</Link>
              <span>/</span>
              <span style={{ color: feature.accent }}>{feature.title}</span>
            </nav>

            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: feature.accent + '18', color: feature.accent }}
            >
              {feature.icon}
            </div>

            {/* Label */}
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: feature.accent }}>
              Funkce MujCRM
            </p>

            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
              {feature.title}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(237,237,237,0.6)' }}>
              {feature.subtitle}
            </p>

            <div className="flex items-center justify-center gap-3 mt-8">
              <Link
                href="/onboarding"
                className="px-6 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: feature.accent, color: '#0a0a0a' }}
              >
                Vyzkoušet zdarma
              </Link>
              <Link
                href="/#funkce"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}
              >
                Všechny funkce
              </Link>
            </div>
          </div>
        </section>

        {/* Content sections */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto flex flex-col gap-14">
            {feature.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl font-bold text-white mb-4">{section.heading}</h2>
                <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(237,237,237,0.6)' }}>
                  {section.body}
                </p>
                {section.bullets && (
                  <ul className="flex flex-col gap-2.5">
                    {section.bullets.map((bullet, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: feature.accent + '18' }}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={feature.accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.7)' }}>
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-8"
              style={{ background: feature.accent + '08', border: `1px solid ${feature.accent}20` }}
            >
              <h2 className="text-xl font-bold text-white mb-5">Pro koho je tato funkce?</h2>
              <ul className="flex flex-col gap-3">
                {feature.useCases.map((uc, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: feature.accent + '25' }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={feature.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.65)' }}>
                      {uc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Časté otázky</h2>
            <div className="flex flex-col gap-4">
              {feature.faq.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-6"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <h3 className="text-base font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.6)' }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="rounded-2xl p-10"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h2 className="text-2xl font-black text-white mb-3">
                Vyzkoušejte {feature.title} v MujCRM
              </h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(237,237,237,0.5)' }}>
                Bez platební karty. Registrace trvá méně než 2 minuty.
              </p>
              <Link
                href="/onboarding"
                className="inline-block px-8 py-4 rounded-xl text-sm font-bold transition-all"
                style={{ background: `linear-gradient(135deg, ${feature.accent}, ${feature.accent}bb)`, color: '#0a0a0a' }}
              >
                Začít zdarma →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
