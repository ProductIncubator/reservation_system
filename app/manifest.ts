import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Randevu – Booking Platform',
    short_name: 'Randevu',
    description: 'Manage your appointments and bookings from anywhere.',
    start_url: '/provider/dashboard',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0f1e',
    theme_color: '#2563eb',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        url: '/provider/dashboard',
        description: 'View your booking dashboard',
      },
      {
        name: 'Bookings',
        url: '/provider/bookings',
        description: 'Manage your appointments',
      },
    ],
  }
}
