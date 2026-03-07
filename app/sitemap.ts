import { MetadataRoute } from 'next';
import { getAllVenues, shipToSlug } from '@/lib/unified-data';
import { getAllCruiseGuideItems } from '@/lib/cruise-guide-data';
import { getAllMovies } from '@/lib/movie-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.disneytrivia.club';

  // Trivia categories
  const triviaCategories = [
    'animation', 'pixar', 'star-wars', 'marvel', 'villains',
    'princesses', 'music', 'parks', 'cruise', 'walt-history',
    'broadway', 'food', 'mixed',
  ];

  const triviaCategoryPages = triviaCategories.map((category) => ({
    url: `${baseUrl}/quiz/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Static Secret-menU pages
  const secretMenuPages = [
    'cruise-guide', 'foodies', 'things-to-do', 'ships', 'entertainment',
    'characters', 'movies', 'hacks', 'shopping', 'stateroom',
    'stateroom-guide', 'sailing', 'venues', 'dining', 'activity',
    'first-timer', 'castaway-wisdom', 'qa',
  ].map((page) => ({
    url: `${baseUrl}/Secret-menU/${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Venue pages (parent + ship-specific for current ships)
  const venues = getAllVenues();
  const venuePages: MetadataRoute.Sitemap = [];
  for (const venue of venues) {
    // Parent venue page
    venuePages.push({
      url: `${baseUrl}/venues/${venue.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    });
    // Ship-specific pages (only current instances)
    for (const si of venue.shipInstances) {
      if (si.current) {
        venuePages.push({
          url: `${baseUrl}/venues/${venue.id}/${shipToSlug(si.ship)}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        });
      }
    }
  }

  // Cruise guide item pages
  const guideItems = getAllCruiseGuideItems();
  const guidePages = guideItems.map((item) => ({
    url: `${baseUrl}/Secret-menU/guide/${item.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Movie pages
  const movies = getAllMovies();
  const moviePages = movies.map((movie) => ({
    url: `${baseUrl}/Secret-menU/movies/${movie.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/Secret-menU`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contribute`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/progress`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...triviaCategoryPages,
    ...secretMenuPages,
    ...venuePages,
    ...guidePages,
    ...moviePages,
  ];
}
