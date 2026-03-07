import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movie Checklist - Disney Film Tracker',
  description: 'Track Disney movies you\'ve watched. Browse films from Walt Disney Animation, Pixar, Marvel, Star Wars, and more.',
  openGraph: {
    title: 'Movie Checklist - Disney Film Tracker',
    description: 'Track Disney movies you\'ve watched across all studios.',
  },
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
