import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Character Checklist - Disney Cruise Line Meet & Greets',
  description: 'Track your Disney character meet and greets on Disney Cruise Line. Check off characters you\'ve met across every sailing.',
  openGraph: {
    title: 'Character Checklist - Disney Cruise Line Meet & Greets',
    description: 'Track your Disney character meet and greets on Disney Cruise Line.',
  },
};

export default function CharactersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
