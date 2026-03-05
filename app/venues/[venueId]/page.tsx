'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getVenueById, getSubVenues, getCategories, shipToSlug } from '@/lib/unified-data';
import type { UnifiedVenue, ShipInstance } from '@/lib/unified-data';

const SHORT_SHIP_NAMES: Record<string, string> = {
  'Disney Magic': 'Magic',
  'Disney Wonder': 'Wonder',
  'Disney Dream': 'Dream',
  'Disney Fantasy': 'Fantasy',
  'Disney Wish': 'Wish',
  'Disney Treasure': 'Treasure',
  'Disney Destiny': 'Destiny',
  'Disney Adventure': 'Adventure',
};

function PositionLabel({ position }: { position: string[] }) {
  const labels: Record<string, string> = { fwd: 'Forward', mid: 'Midship', aft: 'Aft' };
  return <span>{position.map(p => labels[p] || p).join(' / ')}</span>;
}

function ShipInstanceCard({ venue, instance }: { venue: UnifiedVenue; instance: ShipInstance }) {
  const categories = getCategories();
  return (
    <Link
      href={`/venues/${venue.id}/${shipToSlug(instance.ship)}`}
      className="block bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categories[venue.category]?.emoji}</span>
          <h3 className="font-bold text-slate-900 dark:text-white">{instance.name}</h3>
        </div>
        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold border border-disney-blue/20 dark:border-disney-gold/20">
          {SHORT_SHIP_NAMES[instance.ship] || instance.ship}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Deck{instance.decks.length > 1 ? 's' : ''} {instance.decks.join(', ')}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          <PositionLabel position={instance.position} />
        </span>
        {!instance.current && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Historical</span>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{instance.description}</p>
    </Link>
  );
}

export default function VenueParentPage() {
  const params = useParams();
  const venueId = params.venueId as string;

  const venue = getVenueById(venueId);
  const categories = getCategories();
  const subVenues = venue ? getSubVenues(venueId) : [];

  if (!venue) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/Secret-menU/venues" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Venues
        </Link>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Venue Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">We couldn&apos;t find a venue with that ID.</p>
        </div>
      </div>
    );
  }

  const currentInstances = venue.shipInstances.filter(si => si.current);
  const historicalInstances = venue.shipInstances.filter(si => !si.current);

  // If only one ship instance, redirect-style: show detail inline
  const singleShip = venue.shipInstances.length === 1;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/Secret-menU/venues" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Venues
      </Link>

      {/* Venue Concept Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{categories[venue.category]?.emoji}</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{venue.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">{categories[venue.category]?.label}</span>
          {venue.ip && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              {venue.ip}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{venue.description}</p>

        {/* Ship availability pills */}
        <div className="flex flex-wrap gap-1.5">
          {venue.shipInstances.map(si => (
            <Link
              key={si.ship}
              href={`/venues/${venue.id}/${shipToSlug(si.ship)}`}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:ring-2 hover:ring-disney-blue/30 dark:hover:ring-disney-gold/30 ${
                si.current
                  ? 'bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold border border-disney-blue/20 dark:border-disney-gold/20'
                  : 'bg-slate-100/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500'
              }`}
            >
              {SHORT_SHIP_NAMES[si.ship] || si.ship}
              {!si.current && ' (Historical)'}
            </Link>
          ))}
        </div>

        {/* Parent venue link */}
        {venue.parentId && (() => {
          const parent = getVenueById(venue.parentId);
          if (!parent) return null;
          return (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">Part of </span>
              <Link href={`/venues/${parent.id}`} className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline">
                {parent.name}
              </Link>
            </div>
          );
        })()}
      </div>

      {/* Sub-venues */}
      {subVenues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Includes</h2>
          <div className="space-y-2">
            {subVenues.map(sv => (
              <Link
                key={sv.id}
                href={`/venues/${sv.id}`}
                className="block bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{categories[sv.category]?.emoji} {sv.name}</span>
                    {sv.ip && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        {sv.ip}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ship Instances */}
      {singleShip ? (
        // Single ship — show instance details directly with link to review
        <div className="mb-6">
          <ShipInstanceCard venue={venue} instance={venue.shipInstances[0]} />
        </div>
      ) : (
        <>
          {currentInstances.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Available on {currentInstances.length} {currentInstances.length === 1 ? 'Ship' : 'Ships'}
              </h2>
              <div className="space-y-3">
                {currentInstances.map(si => (
                  <ShipInstanceCard key={si.ship} venue={venue} instance={si} />
                ))}
              </div>
            </div>
          )}
          {historicalInstances.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Historical</h2>
              <div className="space-y-3 opacity-60">
                {historicalInstances.map(si => (
                  <ShipInstanceCard key={si.ship} venue={venue} instance={si} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
