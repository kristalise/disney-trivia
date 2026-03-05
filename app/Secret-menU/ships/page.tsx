'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';

type ShipClass = 'Magic Class' | 'Dream Class' | 'Wish Class' | 'Adventure Class';

interface Staterooms {
  inside: number;
  oceanview: number;
  verandah: number;
  concierge: number;
}

interface Ship {
  name: string;
  year: number;
  shipClass: ShipClass;
  tonnage: string;
  passengers: string;
  crew: string;
  length: string;
  decks: number;
  staterooms: Staterooms;
  godparent: string;
  lobbyStatue: string;
  hullBow: string;
  hullStern: string;
  homePort: string;
  regions: string[];
  highlights: string[];
  funFact: string;
  venues?: Record<string, string[]>;
}

const CLASS_IMAGES: Record<ShipClass, string> = {
  'Magic Class': '/ship-photos/ship-class-magic.png',
  'Dream Class': '/ship-photos/ship-class-dream.png',
  'Wish Class': '/ship-photos/ship-class-wish.png',
  'Adventure Class': '/ship-photos/ship-class-adventure.png',
};

const SHIPS: Ship[] = [
  {
    name: 'Disney Magic',
    year: 1998,
    shipClass: 'Magic Class',
    tonnage: '83,338 GT',
    passengers: '2,713',
    crew: '950',
    length: '984 ft (300 m)',
    decks: 11,
    staterooms: { inside: 258, oceanview: 235, verandah: 362, concierge: 22 },
    godparent: 'Patty Disney',
    lobbyStatue: 'Helmsman Mickey',
    hullBow: 'Sorcerer Mickey',
    hullStern: 'Goofy',
    homePort: 'Various (seasonal)',
    regions: ['Caribbean', 'Bahamas', 'Bermuda', 'Canada', 'Europe', 'Transatlantic', 'Panama Canal'],
    highlights: ['Rapunzel\'s Royal Table', 'Animator\'s Palate', 'AquaDunk drop slide', 'Walt Disney Theatre'],
    funFact: 'The first Disney Cruise Line ship ever built. Her hull features a 85-foot-long Sorcerer Mickey stretching across the bow.',
    venues: {
      'Bar': ['Preludes Bar'],
      'Concierge': ['Concierge Lounge', 'Concierge Private Sun Deck'],
      'Entertainment': ['After Hours', 'Beat Street', 'Buena Vista Theatre', 'Walt Disney Theatre'],
      'General Information': ['Disney Vacation Planning', 'Guest Services', 'Health Center', 'Port Adventures', 'Promenade', 'Radio Studio', 'Shutters', 'Shutters Portrait Studio', 'Tender Lobby'],
      'Lounge': ['Cove Café', 'D Lounge', 'Fathoms', 'Keys', "O'Gills Pub", 'Signals', 'Soul Cat Lounge'],
      'Pool': ['AquaDunk', 'AquaLab', "Goofy's Family Pool", "Nephews' Splash Zone", 'Quiet Cove', 'Quiet Cove Pool', "Twist 'n' Spout"],
      'Recreation': ['Senses Spa Fitness Area', 'Wide World of Sports Deck'],
      'Restaurant': ["Animator's Palate", 'Beverage Station', 'Cabanas', "Daisy's De-Lites", 'Duck-In Diner', 'Eye Scream Treats', 'Frozone Treats', "Lumiere's", 'Palo', "Pinocchio's Pizzeria", "Rapunzel's Royal Table", 'Room Service'],
      'Shop': ['Bibbidi Bobbidi Boutique', "Mickey's Mainsail", 'Port Shopping Desk', 'Quacks', 'Sea Treasures', 'The Crown Jewelry', 'Vista Gallery', 'White Caps'],
      'Spa': ['Chill Spa', 'Senses Spa & Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Lab", 'Edge', "it's a small world nursery", 'Vibe'],
    },
  },
  {
    name: 'Disney Wonder',
    year: 1999,
    shipClass: 'Magic Class',
    tonnage: '83,308 GT',
    passengers: '2,713',
    crew: '950',
    length: '984 ft (300 m)',
    decks: 11,
    staterooms: { inside: 258, oceanview: 235, verandah: 362, concierge: 22 },
    godparent: 'Tinker Bell',
    lobbyStatue: 'Ariel',
    hullBow: 'Steamboat Willie Mickey',
    hullStern: 'Donald, Huey, Dewey & Louie',
    homePort: 'Various (seasonal)',
    regions: ['Alaska', 'Bahamas', 'Caribbean', 'Hawaii', 'Mexico', 'Pacific Coast', 'Australia', 'New Zealand'],
    highlights: ['Tiana\'s Place restaurant', 'AquaLab water playground', 'Frozen musical show', 'Señor Frog\'s splash zone'],
    funFact: 'Disney Wonder is the only ship to have sailed to Alaska, Hawaii, Australia, and New Zealand — the most well-traveled ship in the fleet.',
    venues: {
      'Bar': ['Preludes Bar'],
      'Concierge': ['Concierge Lounge', 'Concierge Private Sun Deck'],
      'Entertainment': ['After Hours', 'Buena Vista Theatre', 'Route 66', 'Walt Disney Theatre'],
      'General Information': ['Disney Vacation Planning', 'Guest Services', 'Health Center', 'Port Adventures', 'Promenade', 'Radio Studio', 'Shutters', 'Shutters Portrait Studio', 'Tender Lobby'],
      'Lounge': ['Azure', 'Cadillac Lounge', 'Cove Café', 'Crown & Fin Pub', 'D Lounge', 'French Quarter Lounge', 'Signals'],
      'Pool': ['AquaLab', "Dory's Reef", "Goofy's Family Pool", 'Quiet Cove', 'Quiet Cove Pool', "Twist 'n' Spout"],
      'Recreation': ['Senses Spa Fitness Area', 'Wide World of Sports Deck'],
      'Restaurant': ["Animator's Palate", 'Beverage Station', 'Cabanas', "Daisy's De-Lites", 'Eye Scream Treats', 'Frozone Treats', 'Palo', "Pete's Boiler Bites", "Pinocchio's Pizzeria", 'Room Service', "Sulley's Sips", "Tiana's Place", "Triton's"],
      'Shop': ['Bibbidi Bobbidi Boutique', "Mickey's Mainsail", 'Port Shopping Desk', 'Quacks', 'Sea Treasures', 'Vista Gallery', 'White Caps'],
      'Spa': ['Chill Spa', 'Senses Spa & Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Lab", 'Edge', "it's a small world nursery", 'Vibe'],
    },
  },
  {
    name: 'Disney Dream',
    year: 2011,
    shipClass: 'Dream Class',
    tonnage: '129,690 GT',
    passengers: '4,000',
    crew: '1,458',
    length: '1,115 ft (340 m)',
    decks: 14,
    staterooms: { inside: 150, oceanview: 199, verandah: 861, concierge: 43 },
    godparent: 'Jennifer Hudson',
    lobbyStatue: 'Admiral Donald',
    hullBow: 'Captain Mickey',
    hullStern: 'Sorcerer Mickey & Brooms',
    homePort: 'Port Canaveral, FL',
    regions: ['Bahamas', 'Caribbean', 'Europe', 'Transatlantic'],
    highlights: ['AquaDuck water coaster', 'Enchanted Art virtual portholes', 'Animator\'s Palate interactive dining', 'Bibbidi Bobbidi Boutique'],
    funFact: 'The AquaDuck was the first water coaster at sea — a 765-foot-long transparent tube that extends over the side of the ship.',
    venues: {
      'Bar': ['Currents Bar', 'Waves Bar'],
      'Concierge': ['Concierge Lounge', 'Concierge Private Sun Deck'],
      'Entertainment': ['Buena Vista Theatre', 'Funnel Vision Deck Stage', 'Lobby Atrium', 'Walt Disney Theatre', 'Walt Disney Theatre Balcony Seating'],
      'Food and Beverage': ["Ramone's Cantina"],
      'General Information': ['Disney Vacation Planning', 'Guest Services', 'Health Center', 'Port Adventures', 'Shutters', 'Shutters Portrait Studio', 'Tender Lobby'],
      'Lounge': ['Bon Voyage', 'Cove Bar', 'Cove Café', 'D Lounge', 'District Lounge', 'Evolution', 'Meridian', 'Pink: Wine and Champagne Bar', 'Pub 687', 'Skyline', 'The District', 'Vista Café'],
      'Pool': ['AquaDuck', "Donald's Family Pool", 'Funnel Puddle', "Mickey's Pool", "Nemo's Reef", 'Quiet Cove', 'Quiet Cove Pool', 'Satellite Falls'],
      'Recreation': ["Goofy's Sports Deck", "Goofy's Sports Simulators", "Mickey's Slide", 'Midship Detective Agency', 'Senses Spa Fitness Area', "Tow-Mater's Grill", 'Walking/Jogging Track'],
      'Restaurant': ["Animator's Palate", 'Beverage Station', 'Cabanas', 'Enchanted Garden', 'Eye Scream Treats', "Fillmore's Favorites", "Flo's Cafe", 'Frozone Treats', "Luigi's Pizza", 'Palo', 'Preludes', 'Remy', 'Room Service', 'Royal Palace', "Vanellope's Sweets & Treats"],
      'Shop': ['Bibbidi Bobbidi Boutique', 'Carriage Jewels', 'Disney Vacation Club', "Mickey's Mainsail", 'Sea Treasures', 'Vista Gallery', 'White Caps', 'Whozits & Whatzits'],
      'Spa': ['Senses Spa & Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Lab", 'Edge', "it's a small world nursery", 'Vibe'],
    },
  },
  {
    name: 'Disney Fantasy',
    year: 2012,
    shipClass: 'Dream Class',
    tonnage: '129,750 GT',
    passengers: '4,000',
    crew: '1,458',
    length: '1,115 ft (340 m)',
    decks: 14,
    staterooms: { inside: 150, oceanview: 199, verandah: 861, concierge: 41 },
    godparent: 'Mariah Carey',
    lobbyStatue: 'Mademoiselle Minnie',
    hullBow: 'Sorcerer Mickey',
    hullStern: 'Dumbo & Timothy Q. Mouse',
    homePort: 'Port Canaveral, FL',
    regions: ['Caribbean', 'Bahamas'],
    highlights: ['AquaDuck water coaster', 'Star Wars Day at Sea', 'Remy\'s hidden restaurant', 'Midship Detective Agency'],
    funFact: 'Disney Fantasy features the \"Aqua Lab\" splash area and was the first ship to offer Star Wars Day at Sea events.',
    venues: {
      'Bar': ['Currents Bar'],
      'Concierge': ['Concierge Lounge', 'Concierge Private Sun Deck'],
      'Entertainment': ['Buena Vista Theatre', 'Funnel Vision Deck Stage', 'Lobby Atrium', 'Outlook', 'Walt Disney Theatre', 'Walt Disney Theatre Balcony Seating'],
      'Food and Beverage': ["Ramone's Cantina"],
      'General Information': ['Disney Vacation Planning', 'Guest Services', 'Health Center', 'Port Adventures', 'Radio Studio', 'Shutters', 'Shutters Portrait Studio', 'Tender Lobby'],
      'Lounge': ['Bon Voyage', 'Cove Bar', 'Cove Café', 'D Lounge', 'Europa', 'La Piazza', 'Meridian', "O'Gills Pub", 'Ooh La La', 'Skyline', 'The Tube', 'Vista Café'],
      'Pool': ['AquaDuck', 'AquaLab', "Donald's Family Pool", 'Funnel Puddle', "Mickey's Pool", "Nemo's Reef", 'Quiet Cove', 'Quiet Cove Pool', 'Satellite Falls'],
      'Recreation': ["Goofy's Sports Deck", "Goofy's Sports Simulators", "Mickey's Slide", 'Midship Detective Agency', 'Senses Spa Fitness Area', "Tow-Mater's Grill", 'Walking/Jogging Track'],
      'Restaurant': ["Animator's Palate", 'Beverage Station', 'Cabanas', 'Enchanted Garden', 'Eye Scream Treats', "Fillmore's Favorites", "Flo's Cafe", 'Frozone Treats', "Luigi's Pizza", 'Palo', 'Preludes', 'Remy', 'Room Service', 'Royal Court', 'Sweet on You'],
      'Shop': ['Bibbidi Bobbidi Boutique', 'Bvlgari', 'Carriage Jewels', 'Diamonds & Wishes', "Mickey's Mainsail", 'Quacks', 'Sea Treasures', 'Vista Gallery', 'White Caps', 'Whozits & Whatzits'],
      'Spa': ['Chill Spa', 'Senses Spa & Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Lab", 'Edge', "it's a small world nursery", 'Vibe'],
    },
  },
  {
    name: 'Disney Wish',
    year: 2022,
    shipClass: 'Wish Class',
    tonnage: '144,000 GT',
    passengers: '4,000',
    crew: '1,555',
    length: '1,119 ft (341 m)',
    decks: 14,
    staterooms: { inside: 121, oceanview: 170, verandah: 877, concierge: 70 },
    godparent: 'Make-A-Wish Children',
    lobbyStatue: 'Cinderella',
    hullBow: 'Captain Minnie',
    hullStern: 'Rapunzel & Pascal',
    homePort: 'Port Canaveral, FL',
    regions: ['Bahamas', 'Caribbean'],
    highlights: ['AquaMouse water attraction', 'Star Wars: Hyperspace Lounge', 'Worlds of Marvel dining', 'Grand Hall atrium with Cinderella statue'],
    funFact: 'Disney Wish introduced the first-ever Disney attraction at sea — the AquaMouse, a show-and-ride experience.',
    venues: {
      'Bar': ['Currents Bar', 'Luna Libations', 'Satellite Bar', 'The Lookout'],
      'Concierge': ['Concierge Lounge', 'Concierge Lounge and Pool', 'Concierge Private Sun Deck'],
      'Entertainment': ['Funnel Vision Deck Stage', 'Grand Hall', 'Grand Hall Stage', 'Luna', 'Luna Balcony Seating', 'Never Land Cinema', 'Triton Lounge', 'Walt Disney Theatre Balcony Seating', 'Wonderland Cinema'],
      'General Information': ['Disney Vacation Planning', 'Fairytale Fresh Laundry', 'Guest Services', 'Health Center', "Pluto's Corner", 'Port Adventures', 'Shipside Promenade', 'Shutters', 'Tender Lobby'],
      'Lounge': ['Cove Bar', 'Cove Café', 'Enchanted Sword Café', 'Keg & Compass', "Nightingale's", 'Star Wars: Hyperspace Lounge', 'The Bayou', 'The Rose', 'Wishing Star Café'],
      'Pool': ['AquaMouse', "Chip 'n Dale's Pool", "Daisy's Pool", "Donald's Pool", "Goofy's Pool", "Mickey's Pool", "Minnie's Pool", "Pluto's Pool", 'Quiet Cove', 'Quiet Cove Pool', 'Quiet Cove Whirlpool', 'Slide-a-saurus Rex', 'Sun Deck', 'Toy Story Splash Zone', "Trixie's Falls"],
      'Recreation': ['Hero Zone', 'Senses Fitness'],
      'Restaurant': ['1923', 'Arendelle: A Frozen Dining Adventure', 'Beverage Station', "Daisy's Pizza Pies", "Donald's Cantina", 'Enchanté', "Goofy's Grill", 'Inside Out: Joyful Sweets', 'Marceline Market', 'Mickey & Friends Festival of Foods', "Mickey's Smokestack Barbecue", 'PALO Steakhouse', 'Room Service', "Sweet Minnie's Ice Cream", "Wheezy's Freezies", 'Worlds of Marvel'],
      'Shop': ['3 Wishes', 'Bibbidi Bobbidi Boutique', 'Disney Vacation Club', "Dory's Forget-Me-Knots", 'Enchanted Castle Jewels', "Mickey's Mainsail", 'Once Upon a Time', 'Royal Regalia', 'Treasures Untold'],
      'Spa': ["Hook's Barbery", 'Senses Spa', 'Untangled Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Club Check-In", 'Edge', 'Fairytale Hall', 'Hub', "it's a small world nursery", 'Marvel Super Hero Academy', 'Mickey and Minnie Captain\'s Deck', 'Star Wars: Cargo Bay', 'The Hideaway', 'Vibe', 'Walt Disney Imagineering Lab'],
    },
  },
  {
    name: 'Disney Treasure',
    year: 2024,
    shipClass: 'Wish Class',
    tonnage: '144,000 GT',
    passengers: '4,000',
    crew: '1,555',
    length: '1,119 ft (341 m)',
    decks: 14,
    staterooms: { inside: 121, oceanview: 170, verandah: 877, concierge: 70 },
    godparent: 'Disney Cast Members Worldwide',
    lobbyStatue: 'Aladdin & Jasmine',
    hullBow: 'Voyager Minnie',
    hullStern: 'Peter Pan & Captain Hook',
    homePort: 'Port Canaveral, FL',
    regions: ['Caribbean', 'Bahamas'],
    highlights: ['Adventurers\' themed Grand Hall', 'Persephone\'s lounge', 'Aladdin musical', 'Sarabi lounge'],
    funFact: 'Themed around adventure and exploration, Disney Treasure features a Grand Hall inspired by real-world wonders and the spirit of adventure.',
    venues: {
      'Bar': ['Currents Bar', 'Sarabi Snacks', 'Satellite Bar', 'The Lookout'],
      'Concierge': ['Concierge Lounge', 'Concierge Lounge and Pool', 'Concierge Private Sun Deck'],
      'Entertainment': ['Funnel Vision Deck Stage', 'Grand Hall', 'Grand Hall Stage', 'Never Land Cinema', 'Sarabi', 'Sarabi Balcony Seating', 'Triton Lounge', 'Walt Disney Theatre', 'Walt Disney Theatre Balcony Seating', 'Wonderland Cinema'],
      'General Information': ['Disney Vacation Planning', 'Fairytale Fresh Laundry', 'Guest Services', 'Health Center', "Pluto's Corner", 'Port Adventures', 'Shipside Promenade', 'Shutters', 'Tender Lobby'],
      'Lounge': ['Cove Bar', 'Cove Café', 'Heihei Café', 'Jade Cricket Café', 'Periscope Pub', 'Scat Cat Lounge', 'Skipper Society', 'The Haunted Mansion Parlor', 'The Rose'],
      'Pool': ['AquaMouse', "Chip 'n Dale's Pool", "Daisy's Pool", "Donald's Pool", "Goofy's Pool", "Mickey's Pool", "Minnie's Pool", "Pluto's Pool", 'Quiet Cove', 'Quiet Cove Pool', 'Quiet Cove Whirlpool', 'Slide-a-saurus Rex', 'Sun Deck', 'Toy Story Splash Zone', "Trixie's Falls"],
      'Recreation': ['Hero Zone', 'Senses Fitness'],
      'Restaurant': ['1923', "Daisy's Pizza Pies", "Donald's Cantina", 'Enchanté', "Goofy's Grill", "Jumbeaux's Sweets", 'Marceline Market', 'Mickey & Friends Festival of Foods', "Mickey's Smokestack Barbecue", 'PALO Steakhouse', 'Plaza de Coco', "Sweet Minnie's Ice Cream", "Wheezy's Freezies", 'Worlds of Marvel'],
      'Shop': ['3 Wishes', 'Bibbidi Bobbidi Boutique', 'Disney Vacation Club', "Dory's Forget-Me-Knots", "Mickey's Mainsail", 'Once Upon a Time', 'Palace Treasures', 'Royal Regalia', 'Treasures Untold'],
      'Spa': ["Hook's Barbery", 'Senses Spa', 'Untangled Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Club Check-In", 'Edge', 'Fairytale Hall', 'Hub', "it's a small world nursery", 'Marvel Super Hero Academy', "Mickey and Minnie Captain's Deck", 'Star Wars: Cargo Bay', 'The Hideaway', 'Vibe', 'Walt Disney Imagineering Lab'],
    },
  },
  {
    name: 'Disney Destiny',
    year: 2025,
    shipClass: 'Wish Class',
    tonnage: '144,000 GT',
    passengers: '4,000',
    crew: '1,555',
    length: '1,119 ft (341 m)',
    decks: 14,
    staterooms: { inside: 121, oceanview: 170, verandah: 877, concierge: 70 },
    godparent: 'Susan Egan',
    lobbyStatue: 'Black Panther',
    hullBow: 'Hero Minnie',
    hullStern: 'Spider-Man & Spider-Bots',
    homePort: 'Fort Lauderdale, FL',
    regions: ['Caribbean', 'Bahamas'],
    highlights: ['Heroes & Villains themed Grand Hall', 'Haunted Mansion themed lounge', 'New Disney villain dining experience'],
    funFact: 'Disney Destiny is themed around Disney heroes and villains — the first ship to celebrate both sides of the story.',
    venues: {
      'Bar': ['Cask and Cannon', 'Currents Bar', 'Satellite Bar', 'The Lookout'],
      'Concierge': ['Concierge Lounge', 'Concierge Lounge and Pool', 'Concierge Private Sun Deck'],
      'Entertainment': ['Funnel Vision Deck Stage', 'Grand Hall', 'Grand Hall Stage', 'Never Land Cinema', 'Saga', 'Saga Balcony Seating', 'Triton Lounge', 'Walt Disney Theatre', 'Walt Disney Theatre Balcony Seating', 'Wonderland Cinema'],
      'Food and Beverage': ['Café Megara', 'Café Merida', 'Edna Á La Mode Sweets', 'Saga Snacks'],
      'General Information': ['Disney Vacation Planning', 'Fairytale Fresh Laundry', 'Guest Services', 'Health Center', "Pluto's Corner", 'Port Adventures', 'Shipside Promenade', 'Shutters', 'Tender Lobby'],
      'Lounge': ['Cove Bar', 'Cove Café', "De Vil's", 'The Haunted Mansion Parlor', 'The Rose', 'The Sanctum'],
      'Pool': ['AquaMouse', "Chip 'n Dale's Pool", "Daisy's Pool", "Donald's Pool", "Goofy's Pool", "Mickey's Pool", "Minnie's Pool", "Pluto's Pool", 'Quiet Cove', 'Quiet Cove Pool', 'Quiet Cove Whirlpool', 'Slide-a-saurus Rex', 'Sun Deck', 'Toy Story Splash Zone', "Trixie's Falls"],
      'Recreation': ['Hero Zone', 'Senses Fitness'],
      'Restaurant': ['1923', "Daisy's Pizza Pies", "Donald's Cantina", 'Enchanté', "Goofy's Grill", 'Marceline Market', 'Mickey & Friends Festival of Foods', "Mickey's Smokestack Barbecue", 'PALO Steakhouse', 'Pride Lands: Feast of The Lion King', "Sweet Minnie's Ice Cream", "Wheezy's Freezies", 'Worlds of Marvel'],
      'Shop': ['3 Wishes', 'Bibbidi Bobbidi Boutique', 'Disney Vacation Club', "Dory's Forget-Me-Knots", "Mickey's Mainsail", 'Once Upon a Time', 'Palace Treasures', 'Royal Regalia', 'Treasures Untold'],
      'Spa': ["Hook's Barbery", 'Senses Spa', 'Untangled Salon'],
      'Youth Club': ["Disney's Oceaneer Club", "Disney's Oceaneer Club Check-In", 'Edge', 'Fairytale Hall', 'Hub', "it's a small world nursery", 'Marvel Super Hero Academy', "Mickey and Minnie Captain's Deck", 'Star Wars: Cargo Bay', 'The Hideaway', 'Vibe', 'Walt Disney Imagineering Lab'],
    },
  },
  {
    name: 'Disney Adventure',
    year: 2026,
    shipClass: 'Adventure Class',
    tonnage: '208,000 GT',
    passengers: '6,700',
    crew: '2,500',
    length: '1,122 ft (342 m)',
    decks: 16,
    staterooms: { inside: 560, oceanview: 67, verandah: 1326, concierge: 157 },
    godparent: 'Robert Downey Jr.',
    lobbyStatue: 'Snow White',
    hullBow: 'Captain Mickey',
    hullStern: 'Captain Mickey & Captain Minnie',
    homePort: 'Singapore',
    regions: ['Southeast Asia'],
    highlights: ['7 themed districts', 'Toy Story Place', 'San Fransokyo Street', 'Marvel Landing', 'Wayfinder Bay'],
    funFact: 'At 208,000 gross tons, Disney Adventure is by far the largest Disney ship ever built — nearly 2.5x the size of the original Disney Magic.',
    venues: {
      'Attractions': ['Groot Galaxy Spin', 'Ironcycle Test Run', 'Pym Quantum Racers'],
      'Bar': ['Buccaneer Bar', 'Garden Bar', 'Infinity Bar', 'Market Bar', 'Wayfinder Bar'],
      'Concierge': ['Concierge Lounge'],
      'Entertainment': ['Baymax Cinemas', 'Big Hero Arcade', 'Garden Stage', 'Private Karaoke Rooms', 'Walt Disney Theatre'],
      'Food and Beverage': ['Alley Cat Café', 'Bewitching Boba & Brews', 'Bounce and Hops', 'Concierge Sundeck Dining', 'Cosmic Kebabs', "Gramma Tala's Kitchen", "Mowgli's Eatery", 'Palo Café', 'Pizza Planet', 'Premiere Sips & Snacks', "Stitch's 'Ohana Grill"],
      'General Information': ['Disney Studio', 'Fairytale Fresh Laundry', 'Guest Services', 'Medical Center', 'Pics Photo Shop', 'Prayer Room', 'Royal Studio'],
      'Lounge': ['D Lounge', 'Royal Court Lounge', 'Spellbound', 'Taverna Portorosso'],
      'Merchandise': ['Marvel Style'],
      'Pool': ['Concierge Sundeck & Pool', 'Flying Saucer Splash Zone', 'Infinity Pool', 'Sunnyside Pool', 'Toy Story Splash Pad', "Woody & Jessie's Wild Slides"],
      'Recreation': ['Concierge Fitness Center', 'Fitness Center', 'Running Track'],
      'Restaurant': ["Animator's Palate", "Animator's Table", 'Enchanted Summer', 'Hollywood Spotlight Club Restaurant', "Mike & Sulley's Flavors of Asia", "Navigator's Club Restaurant", 'Palo Trattoria', 'Pixar Market', "Wheezy's Freezies"],
      'Shop': ['3 Wishes', 'Bibbidi Bobbidi Boutique', 'Castle Collection', 'Diamonds & Wishes', 'Duffy and Friends Shop', 'National Geographic', 'Palace Treasures', 'Treasures Untold', 'World of Disney', 'World of Disney Too'],
      'Spa': ['Opulence Spa - Elemis at Sea'],
      'Themed Area': ['Disney Discovery Reef', "Disney's Imagination Garden", 'Marvel Landing', 'San Fransokyo Street', 'Town Square', 'Toy Story Place', 'Wayfinder Bay'],
      'Youth Club': ["Andy's Toy Box", "Disney's Oceaneer Club", 'Edge', 'Fairytale Hall', "it's a small world nursery", 'Marvel WEB Workshop', "Mickey and Minnie Captain's Deck", 'Vibe', 'Walt Disney Imagineering Lab'],
    },
  },
];

const SHIP_EMOJI: Record<string, string> = {
  'Disney Magic': '✨',
  'Disney Wonder': '🌟',
  'Disney Dream': '💫',
  'Disney Fantasy': '🌠',
  'Disney Wish': '🪄',
  'Disney Treasure': '🗺',
  'Disney Destiny': '⚔️',
  'Disney Adventure': '🏝',
};

const CASTAWAY_LEVELS = [
  { level: 'first-time', label: 'First-Time', emoji: '⚓', sailings: '0', checkInDays: 30, activityDays: 75, earlyBookingDays: 0, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-700/40' },
  { level: 'silver', label: 'Silver', emoji: '🥈', sailings: '1–4', checkInDays: 33, activityDays: 90, earlyBookingDays: 1, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/60' },
  { level: 'gold', label: 'Gold', emoji: '🥇', sailings: '5–9', checkInDays: 35, activityDays: 105, earlyBookingDays: 2, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { level: 'platinum', label: 'Platinum', emoji: '💎', sailings: '10–24', checkInDays: 38, activityDays: 120, earlyBookingDays: 3, color: 'text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { level: 'pearl', label: 'Pearl', emoji: '🤍', sailings: '25+', checkInDays: 40, activityDays: 123, earlyBookingDays: 4, color: 'text-slate-200', bg: 'bg-slate-50 dark:bg-slate-600/30' },
  { level: 'concierge', label: 'Concierge', emoji: '👑', sailings: 'Any', checkInDays: 40, activityDays: 130, earlyBookingDays: 4, color: 'text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
];

function parseLocal(ds: string) {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getUserCastawayIndex(pastCount: number): number {
  if (pastCount >= 25) return 4; // pearl
  if (pastCount >= 10) return 3; // platinum
  if (pastCount >= 5) return 2;  // gold
  if (pastCount >= 1) return 1;  // silver
  return 0; // first-time
}

export default function ShipsPage() {
  const { user, session } = useAuth();
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [calcDate, setCalcDate] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [pastSailingCount, setPastSailingCount] = useState(0);

  useEffect(() => {
    if (!user || !session?.access_token) return;
    fetch('/api/sailing-reviews/mine', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.sailings) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          setPastSailingCount(data.sailings.filter((s: { sail_end_date: string }) => new Date(s.sail_end_date + 'T23:59:59') < now).length);
        }
      })
      .catch(() => {});
  }, [user, session?.access_token]);

  const userLevelIndex = useMemo(() => getUserCastawayIndex(pastSailingCount), [pastSailingCount]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">🚢 Meet the Fleet</h1>
        <p className="text-slate-600 dark:text-slate-400">Explore every ship in the Disney Cruise Line fleet.</p>
      </div>

      {/* Castaway Club Booking Calculator */}
      {!selectedShip && (
        <div className="mb-6">
          <button
            onClick={() => setShowCalc(v => !v)}
            className="w-full flex items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-800 rounded-2xl px-5 py-3.5 shadow-md border border-cyan-400/30 text-left"
          >
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <span>📅</span>
              Castaway Club Booking Calculator
            </span>
            <svg
              className={`w-4 h-4 text-cyan-200 transition-transform ${showCalc ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCalc && (
            <div className="mt-3 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700 space-y-5">
              {/* Date Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  When does your cruise depart?
                </label>
                <input
                  type="date"
                  value={calcDate}
                  onChange={(e) => setCalcDate(e.target.value)}
                  min={today.toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
                />
              </div>

              {/* Results for chosen date */}
              {calcDate && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Key Dates for {parseLocal(calcDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h4>
                  {CASTAWAY_LEVELS.map((cl, i) => {
                    const sailDate = parseLocal(calcDate);
                    const actDate = new Date(sailDate);
                    actDate.setDate(actDate.getDate() - cl.activityDays);
                    const ciDate = new Date(sailDate);
                    ciDate.setDate(ciDate.getDate() - cl.checkInDays);
                    const isUser = i === userLevelIndex;
                    return (
                      <div
                        key={cl.level}
                        className={`rounded-xl p-3 border ${isUser ? 'border-disney-blue dark:border-disney-gold ring-1 ring-disney-blue/30 dark:ring-disney-gold/30' : 'border-slate-200 dark:border-slate-700'} ${cl.bg}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {cl.emoji} {cl.label}
                            <span className="text-[10px] font-normal text-slate-400">({cl.level === 'concierge' ? 'stateroom' : cl.sailings === '0' ? 'first cruise' : cl.sailings + ' sailings'})</span>
                          </span>
                          {isUser && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-disney-blue/10 dark:bg-disney-gold/10 text-disney-blue dark:text-disney-gold">
                              Your Level
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-slate-500 dark:text-slate-400">Activity Booking</div>
                            <div className={`font-semibold ${today >= actDate ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                              {today >= actDate ? 'Open now' : actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500 dark:text-slate-400">Online Check-in</div>
                            <div className={`font-semibold ${today >= ciDate ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                              {today >= ciDate ? 'Open now' : ciDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reverse lookup: what can I book today? */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Latest Sailing You Can Book Today
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                  Based on today ({today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}), the furthest-out sailing date you can act on:
                </p>
                {CASTAWAY_LEVELS.map((cl, i) => {
                  const latestActivity = new Date(today);
                  latestActivity.setDate(latestActivity.getDate() + cl.activityDays);
                  const latestCheckIn = new Date(today);
                  latestCheckIn.setDate(latestCheckIn.getDate() + cl.checkInDays);
                  const isUser = i === userLevelIndex;
                  return (
                    <div
                      key={cl.level}
                      className={`flex items-center gap-3 py-2 ${i < CASTAWAY_LEVELS.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                    >
                      <span className={`text-sm ${isUser ? 'font-bold' : ''}`}>{cl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold ${isUser ? 'text-disney-blue dark:text-disney-gold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {cl.label}
                        </span>
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="text-slate-900 dark:text-white font-medium">
                          Activities: {latestActivity.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          Check-in: {latestCheckIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Early Booking for New Itineraries */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Early Booking for New Itineraries
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                  Book new cruise itineraries before the general public.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CASTAWAY_LEVELS.map((cl, i) => {
                    const isUser = i === userLevelIndex;
                    return (
                      <div
                        key={cl.level}
                        className={`rounded-xl p-2.5 text-center border ${isUser ? 'border-disney-blue dark:border-disney-gold' : 'border-slate-200 dark:border-slate-700'} ${cl.bg}`}
                      >
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{cl.earlyBookingDays === 0 ? '—' : cl.earlyBookingDays}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{cl.earlyBookingDays === 0 ? 'Same day' : cl.earlyBookingDays === 1 ? 'day early' : 'days early'}</div>
                        <div className="text-[10px] font-medium mt-0.5 text-slate-600 dark:text-slate-300">{cl.emoji} {cl.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedShip ? (
        <div className="space-y-3">
          {SHIPS.map((ship) => (
            <button
              key={ship.name}
              onClick={() => { setSelectedShip(ship); }}
              className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{SHIP_EMOJI[ship.name] || '🚢'}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{ship.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {ship.year} &middot; {ship.shipClass} &middot; {ship.passengers} guests
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">{ship.homePort}</span>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            onClick={() => setSelectedShip(null)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to fleet
          </button>

          {/* Ship Switcher */}
          <div className="mb-4">
            <select
              value={selectedShip.name}
              onChange={(e) => {
                const ship = SHIPS.find(s => s.name === e.target.value);
                if (ship) { setSelectedShip(ship); }
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
            >
              {SHIPS.map(ship => (
                <option key={ship.name} value={ship.name}>
                  {SHIP_EMOJI[ship.name]} {ship.name} ({ship.year})
                </option>
              ))}
            </select>
          </div>

          {/* Ship Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{SHIP_EMOJI[selectedShip.name] || '🚢'}</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedShip.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Maiden Voyage: {selectedShip.year} &middot; {selectedShip.shipClass}
                </p>
              </div>
            </div>

            <div className="mb-4 px-2">
              <Image
                src={CLASS_IMAGES[selectedShip.shipClass]}
                alt={`${selectedShip.shipClass} silhouette`}
                width={768}
                height={160}
                className="w-full h-auto opacity-70 dark:opacity-40 dark:invert"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300 mb-4 italic">
              {selectedShip.funFact}
            </div>

            {/* Ship Identity */}
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Ship Identity</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedShip.godparent}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Godparent</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedShip.lobbyStatue}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Lobby Statue</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedShip.hullBow}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Hull Art — Bow</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedShip.hullStern}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Hull Art — Stern</div>
              </div>
            </div>

            {/* Ship Stats */}
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Ship Specifications</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.tonnage}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Gross Tonnage</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Length</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.passengers}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Passengers</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.crew}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Crew</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.decks}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Decks</div>
              </div>
              <Link href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip.name)}`} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {(selectedShip.staterooms.inside + selectedShip.staterooms.oceanview + selectedShip.staterooms.verandah + selectedShip.staterooms.concierge).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Staterooms</div>
              </Link>
            </div>

            {/* Stateroom Categories */}
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Stateroom Categories</h4>
            <div className="grid grid-cols-4 gap-2">
              <Link href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip.name)}&type=Inside`} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.staterooms.inside.toLocaleString()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Inside</div>
              </Link>
              <Link href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip.name)}&type=Oceanview`} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.staterooms.oceanview.toLocaleString()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Oceanview</div>
              </Link>
              <Link href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip.name)}&type=Verandah`} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.staterooms.verandah.toLocaleString()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Verandah</div>
              </Link>
              <Link href={`/Secret-menU/stateroom?ship=${encodeURIComponent(selectedShip.name)}&type=${encodeURIComponent('Concierge / Suite')}`} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedShip.staterooms.concierge.toLocaleString()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Concierge</div>
              </Link>
            </div>
          </div>

          {/* Home Port & Regions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Where She Sails</h3>
            <div className="mb-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Home Port:</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white ml-2">{selectedShip.homePort}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedShip.regions.map(region => (
                <span key={region} className="px-3 py-1.5 rounded-full text-sm font-medium bg-disney-blue/10 dark:bg-disney-gold/10 text-disney-blue dark:text-disney-gold border border-disney-blue/20 dark:border-disney-gold/20">
                  {region}
                </span>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
