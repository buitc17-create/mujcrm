import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MujCRM',
    short_name: 'MujCRM',
    description: 'CRM systém pro české podnikatele a firmy',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    lang: 'cs',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Kontakty',
        short_name: 'Kontakty',
        description: 'Otevřít seznam kontaktů',
        url: '/dashboard/contacts',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Úkoly',
        short_name: 'Úkoly',
        description: 'Otevřít seznam úkolů',
        url: '/dashboard/tasks',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Leady',
        short_name: 'Leady',
        description: 'Otevřít správu leadů',
        url: '/dashboard/leads',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
