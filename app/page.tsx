import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DashboardMock from './components/DashboardMock';
import HowItWorks from './components/HowItWorks';
import ForWho from './components/ForWho';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import SupportFAQ from './components/SupportFAQ';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AnimatedBackgroundClient from './components/AnimatedBackgroundClient';

export default function Home() {
  return (
    <div style={{ background: '#0a0a0a', position: 'relative' }}>
      {/* Animated bezier lines — fixed, full page, z-index 0 */}
      <AnimatedBackgroundClient />

      {/* All page content sits above canvas via z-index 1 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnnouncementBar />
        <Navbar />
        <main className="flex flex-col">
          <Hero />
          <DashboardMock />
          <HowItWorks />
          <ForWho />
          <Features />
          <Testimonials />
          <Pricing />
          <SupportFAQ />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </div>
  );
}
