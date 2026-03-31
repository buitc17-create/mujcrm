import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogGrid from './components/BlogGrid';

export default function BlogPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Blog
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Tipy a průvodci pro váš byznys
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(237,237,237,0.5)' }}>
            Praktické rady, srovnání a návody pro podnikatele a firmy v ČR, kteří chtějí CRM využívat naplno.
          </p>
        </div>

        {/* Filterable grid — client component */}
        <BlogGrid />

        {/* Bottom CTA */}
        <div
          className="mt-20 rounded-2xl p-10 text-center"
          style={{ background: 'rgba(0,191,255,0.04)', border: '1px solid rgba(0,191,255,0.1)' }}
        >
          <h2 className="text-xl font-bold text-white mb-2">Připraveni začít?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.5)' }}>
            Vyzkoušejte MujCRM 7 dní zdarma. Bez platební karty, bez závazků.
          </p>
          <a
            href="/onboarding"
            className="btn-cyan inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
          >
            Vyzkoušet MujCRM zdarma →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
