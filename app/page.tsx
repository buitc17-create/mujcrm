import type { Metadata } from "next";
import dynamic from 'next/dynamic';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DashboardMock from './components/DashboardMock';
import HowItWorks from './components/HowItWorks';
import AnimatedBackgroundClient from './components/AnimatedBackgroundClient';

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.mujcrm.cz",
  },
};

const ForWho = dynamic(() => import('./components/ForWho'));
const Features = dynamic(() => import('./components/Features'));
const Pricing = dynamic(() => import('./components/Pricing'));
const SupportFAQ = dynamic(() => import('./components/SupportFAQ'));
const ContactForm = dynamic(() => import('./components/ContactForm'));
const Footer = dynamic(() => import('./components/Footer'));

export default function Home() {
  return (
    <div className="page-root">
      <AnimatedBackgroundClient />
      <div className="page-content">
        <AnnouncementBar />
        <Navbar />
        <main className="flex flex-col">
          <Hero />
          <DashboardMock />
          <HowItWorks />
          <ForWho />
          <section id="funkce"><Features /></section>
          <section id="pricing"><Pricing /></section>
          <section id="podpora"><SupportFAQ /></section>
          <section id="kontakt"><ContactForm /></section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
