'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/quiz', label: 'Quiz' },
    { href: '/search', label: 'Search' },
    { href: '/contribute', label: 'Contribute' },
    { href: '/progress', label: 'Progress' },
  ];

  return (
    <nav className="bg-disney-gradient sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/icon-72x72.png"
              alt="Disney Trivia"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-xl hidden sm:inline">Disney Trivia</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
