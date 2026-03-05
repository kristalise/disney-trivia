#!/usr/bin/env node

/**
 * Test User Seed Script
 * Seeds realistic test data for existing auth users.
 *
 * Usage:
 *   # Load env and run:
 *   export $(grep -v '^#' .env.local | xargs) && node scripts/seed-test-users.js
 *
 * Before running:
 *   1. Sign up users through the app (or Supabase dashboard > Authentication)
 *   2. Update the USERS map below with their UUIDs
 *   3. Run this script to seed all test data
 *
 * Test Users:
 *   kristabelq   — kristabelq@gmail.com   (Pearl: 26 sailings)
 *   goldsailor   — (sign up manually)     (Gold: 7 sailings)
 *   silverwaves  — (sign up manually)     (Silver: 3 sailings)
 *   firsttimer   — (sign up manually)     (First-timer: 1 upcoming)
 *   cruisebuddy  — (sign up manually)     (Companion user)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Run with:');
  console.error('  export $(grep -v \'#\' .env.local | xargs) && node scripts/seed-test-users.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Configuration ────────────────────────────────────────────────
// Set to true to only seed for kristabelq (skip multi-user scenarios)
const SINGLE_USER_MODE = true;

// Map of auth user IDs — update these after creating accounts
const USERS = {
  kristabel: 'f36fda83-b439-4e6d-bcb8-5a64375a2852', // kristabelq@gmail.com (existing)
  // Uncomment and fill in after creating these accounts:
  // gold:      'UUID_HERE',
  // silver:    'UUID_HERE',
  // firstTimer:'UUID_HERE',
  // companion: 'UUID_HERE',
};

// ── Helpers ──────────────────────────────────────────────────────
function pastDate(yearsAgo, month, day) {
  const y = new Date().getFullYear() - yearsAgo;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function futureDate(monthsAhead, day) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── Sailing Data ─────────────────────────────────────────────────
function kristabelSailings() {
  return [
    // 26 past sailings (Pearl level = 25+) + 1 upcoming
    { ship_name: 'Disney Magic', sail_start_date: pastDate(8, 3, 15), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [5024], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Magic', sail_start_date: pastDate(8, 6, 10), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [6122], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Wonder', sail_start_date: pastDate(7, 1, 20), nights: 7, embarkation_port: 'San Diego', ports_of_call: 'Cabo San Lucas, Ensenada', stateroom_numbers: [7042], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Wonder', sail_start_date: pastDate(7, 8, 5), nights: 5, embarkation_port: 'Vancouver', ports_of_call: 'Juneau, Skagway, Ketchikan', stateroom_numbers: [8510], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(6, 2, 14), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [9224], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(6, 7, 1), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Grand Cayman', stateroom_numbers: [10112], num_pax: 3, adults: 2, children: 1, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Fantasy', sail_start_date: pastDate(5, 3, 22), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Grand Cayman, Castaway Cay', stateroom_numbers: [6510], num_pax: 3, adults: 2, children: 1, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Fantasy', sail_start_date: pastDate(5, 10, 10), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'St. Thomas, Tortola, Castaway Cay', stateroom_numbers: [7230], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Magic', sail_start_date: pastDate(4, 4, 5), nights: 5, embarkation_port: 'Miami', ports_of_call: 'Key West, Castaway Cay', stateroom_numbers: [5510], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Wonder', sail_start_date: pastDate(4, 9, 15), nights: 7, embarkation_port: 'San Diego', ports_of_call: 'Puerto Vallarta, Cabo San Lucas, Ensenada', stateroom_numbers: [6044], num_pax: 4, adults: 2, children: 2, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(3, 1, 10), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [8024], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(3, 5, 20), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Castaway Cay', stateroom_numbers: [9046], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Fantasy', sail_start_date: pastDate(3, 11, 8), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Grand Cayman, Falmouth, Castaway Cay', stateroom_numbers: [10524], num_pax: 4, adults: 2, children: 2, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(2, 2, 1), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [7122], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(2, 4, 15), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Castaway Cay, Nassau', stateroom_numbers: [8234], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(2, 7, 20), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [9312], num_pax: 3, adults: 2, children: 1, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(2, 10, 5), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Castaway Cay', stateroom_numbers: [6524], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Fantasy', sail_start_date: pastDate(1, 1, 12), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'St. Thomas, Tortola, Castaway Cay', stateroom_numbers: [10234], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(1, 3, 18), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [5122], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(1, 6, 1), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [8042], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Magic', sail_start_date: pastDate(1, 8, 14), nights: 5, embarkation_port: 'New York', ports_of_call: 'Port Canaveral, Nassau, Castaway Cay', stateroom_numbers: [6230], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    // B2B sailings on Treasure
    { ship_name: 'Disney Treasure', sail_start_date: pastDate(0, 1, 5), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Tortola, St. Thomas, Castaway Cay', stateroom_numbers: [9510], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Treasure', sail_start_date: pastDate(0, 1, 12), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Grand Cayman, Castaway Cay', stateroom_numbers: [7044], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Wonder', sail_start_date: pastDate(0, 3, 1), nights: 5, embarkation_port: 'San Diego', ports_of_call: 'Cabo San Lucas, Ensenada', stateroom_numbers: [8122], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(0, 4, 10), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [6312], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 5 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(0, 5, 20), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [7524], num_pax: 2, adults: 2, children: 0, infants: 0, overall_rating: 4 },
    // Upcoming sailing (no rating)
    { ship_name: 'Disney Wish', sail_start_date: futureDate(3, 15), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [9112, 9114], num_pax: 4, adults: 2, children: 2, infants: 0, overall_rating: null },
  ];
}

function goldSailings() {
  return [
    { ship_name: 'Disney Fantasy', sail_start_date: pastDate(4, 6, 1), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Grand Cayman, Castaway Cay', stateroom_numbers: [8234], num_pax: 2, adults: 2, overall_rating: 5 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(3, 3, 10), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [6122], num_pax: 3, adults: 2, children: 1, overall_rating: 4 },
    { ship_name: 'Disney Wish', sail_start_date: pastDate(2, 7, 20), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [9044], num_pax: 2, adults: 2, overall_rating: 5 },
    { ship_name: 'Disney Wonder', sail_start_date: pastDate(2, 11, 5), nights: 7, embarkation_port: 'San Diego', ports_of_call: 'Cabo San Lucas, Ensenada', stateroom_numbers: [7510], num_pax: 4, adults: 2, children: 2, overall_rating: 4 },
    { ship_name: 'Disney Magic', sail_start_date: pastDate(1, 5, 15), nights: 5, embarkation_port: 'Miami', ports_of_call: 'Key West, Castaway Cay', stateroom_numbers: [5312], num_pax: 2, adults: 2, overall_rating: 5 },
    { ship_name: 'Disney Treasure', sail_start_date: pastDate(0, 2, 1), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Tortola, St. Thomas, Castaway Cay', stateroom_numbers: [8122], num_pax: 2, adults: 2, overall_rating: 5 },
    { ship_name: 'Disney Fantasy', sail_start_date: futureDate(2, 10), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Cozumel, Grand Cayman, Castaway Cay', stateroom_numbers: [7234], num_pax: 2, adults: 2, overall_rating: null },
  ];
}

function silverSailings() {
  return [
    { ship_name: 'Disney Wish', sail_start_date: pastDate(1, 8, 1), nights: 3, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [6234], num_pax: 4, adults: 2, children: 2, overall_rating: 5 },
    { ship_name: 'Disney Dream', sail_start_date: pastDate(0, 4, 12), nights: 4, embarkation_port: 'Port Canaveral', ports_of_call: 'Nassau, Castaway Cay', stateroom_numbers: [8044], num_pax: 4, adults: 2, children: 2, overall_rating: 4 },
    { ship_name: 'Disney Treasure', sail_start_date: futureDate(4, 5), nights: 7, embarkation_port: 'Port Canaveral', ports_of_call: 'Tortola, St. Thomas, Castaway Cay', stateroom_numbers: [9312], num_pax: 4, adults: 2, children: 2, overall_rating: null },
  ];
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('=== Disney Trivia Test Data Seed ===\n');

  const kristabel = USERS.kristabel;
  const gold = USERS.gold;
  const silver = USERS.silver;
  const firstTimer = USERS.firstTimer;
  const companion = USERS.companion;

  const multiUser = !SINGLE_USER_MODE && gold && silver && firstTimer && companion;

  // ── Step 1: Update profile ─────────────────────────────────────
  console.log('Step 1: Updating KristabelQ profile...');
  const { error: profError } = await supabase.from('user_profiles').upsert({
    id: kristabel,
    display_name: 'KristabelQ',
    handle: 'kristabelq',
    bio: 'Pearl Castaway Club member. 26 sailings and counting!',
    home_port: 'Port Canaveral',
    favorite_ship: 'Disney Wish',
    dcl_membership: 'Platinum Castaway',
  }, { onConflict: 'id' });
  console.log(profError ? `  ✗ ${profError.message}` : '  ✓ Profile updated');

  // ── Step 2: Create sailings ────────────────────────────────────
  console.log('\nStep 2: Creating sailing records...');

  // Clear existing sailings for kristabel to avoid duplicates on re-run
  const { data: existingSailings } = await supabase
    .from('sailing_reviews')
    .select('id')
    .eq('user_id', kristabel);

  if (existingSailings && existingSailings.length > 0) {
    console.log(`  Clearing ${existingSailings.length} existing sailings...`);
    // Delete in batches (cascade will clean up related data)
    for (const s of existingSailings) {
      await supabase.from('sailing_reviews').delete().eq('id', s.id);
    }
  }

  const sailingIds = { kristabel: [], gold: [], silver: [] };

  async function insertSailings(userId, sailingsData, label, key) {
    for (const s of sailingsData) {
      const endDate = addDays(s.sail_start_date, s.nights);
      const { data, error } = await supabase.from('sailing_reviews').insert({
        user_id: userId,
        ship_name: s.ship_name,
        sail_start_date: s.sail_start_date,
        sail_end_date: endDate,
        embarkation_port: s.embarkation_port,
        disembarkation_port: s.embarkation_port,
        ports_of_call: s.ports_of_call,
        stateroom_numbers: s.stateroom_numbers,
        num_pax: s.num_pax,
        adults: s.adults || 2,
        children: s.children || 0,
        infants: s.infants || 0,
        overall_rating: s.overall_rating,
      }).select('id').single();

      if (error) {
        console.error(`  ✗ ${label} sailing:`, error.message);
      } else {
        sailingIds[key].push({ id: data.id, ...s, sail_end_date: endDate });
      }
    }
    console.log(`  ✓ ${label}: ${sailingIds[key].length} sailings created`);
  }

  await insertSailings(kristabel, kristabelSailings(), 'KristabelQ', 'kristabel');

  if (multiUser) {
    // Clear and re-seed for other users too
    for (const uid of [gold, silver]) {
      const { data: ex } = await supabase.from('sailing_reviews').select('id').eq('user_id', uid);
      for (const s of (ex || [])) await supabase.from('sailing_reviews').delete().eq('id', s.id);
    }
    await insertSailings(gold, goldSailings(), 'GoldSailor', 'gold');
    await insertSailings(silver, silverSailings(), 'SilverWaves', 'silver');
  }

  // ── Step 3: Venue reviews ──────────────────────────────────────
  console.log('\nStep 3: Creating venue reviews...');
  // Clear existing
  await supabase.from('venue_reviews').delete().eq('user_id', kristabel);

  const venueReviews = [
    { sailing_idx: 13, venue_id: 'palo', ship: 'Disney Wish', rating: 5, atmosphere_rating: 5, theming_rating: 5, visited_with: ['Partner'], review_text: 'Palo on the Wish is absolutely incredible. The views and food are perfection.' },
    { sailing_idx: 6, venue_id: 'palo', ship: 'Disney Fantasy', rating: 4, atmosphere_rating: 4, theming_rating: 4, visited_with: ['Partner'], review_text: 'Classic Palo experience on the Fantasy. Always a must-do.' },
    { sailing_idx: 21, venue_id: 'palo', ship: 'Disney Treasure', rating: 5, atmosphere_rating: 5, theming_rating: 5, visited_with: ['Solo'], review_text: 'Treasure Palo is a new experience. Loved it.' },
    { sailing_idx: 14, venue_id: 'aquamouse', ship: 'Disney Wish', rating: 4, review_text: 'AquaMouse is so fun! Rode it 10 times.' },
    { sailing_idx: 13, venue_id: 'nightingales', ship: 'Disney Wish', rating: 5, atmosphere_rating: 5, theming_rating: 5, visited_with: ['Partner', 'Friends'], review_text: 'The hidden speakeasy. Best cocktails on the Wish!' },
    { sailing_idx: 7, venue_id: 'satellite-falls', ship: 'Disney Fantasy', rating: 4, atmosphere_rating: 5, visited_with: ['Solo'], review_text: 'Best adults-only pool area on any ship. So peaceful.' },
    { sailing_idx: 21, venue_id: 'haunted-mansion-parlor', ship: 'Disney Treasure', rating: 5, atmosphere_rating: 5, theming_rating: 5, visited_with: ['Solo'], review_text: 'The theming is unbelievable. Every detail is perfect.' },
  ];

  for (const r of venueReviews) {
    const sailing = sailingIds.kristabel[r.sailing_idx];
    if (!sailing) continue;
    const { error } = await supabase.from('venue_reviews').insert({
      user_id: kristabel,
      sailing_id: sailing.id,
      venue_id: r.venue_id,
      ship_name: r.ship,
      rating: r.rating,
      atmosphere_rating: r.atmosphere_rating || null,
      theming_rating: r.theming_rating || null,
      visited_with: r.visited_with || null,
      review_text: r.review_text,
    });
    if (error) console.error(`  ✗ Venue ${r.venue_id}:`, error.message);
  }
  console.log(`  ✓ ${venueReviews.length} venue reviews`);

  // ── Step 4: Dining reviews ─────────────────────────────────────
  console.log('\nStep 4: Creating dining reviews...');
  await supabase.from('dining_reviews').delete().eq('user_id', kristabel);

  const diningReviews = [
    { sailing_idx: 13, restaurant_id: 'arendelle', ship: 'Disney Wish', rating: 5, review_text: 'Arendelle is magical. The show and food are both top-notch.' },
    { sailing_idx: 6, restaurant_id: 'animators-palate', ship: 'Disney Fantasy', rating: 4, review_text: "Animator's Palate is classic. The animation show is still delightful." },
    { sailing_idx: 13, restaurant_id: 'worlds-of-marvel', ship: 'Disney Wish', rating: 5, review_text: 'Quantum Encounter dinner is amazing! Highly interactive.' },
    { sailing_idx: 21, restaurant_id: '1923', ship: 'Disney Treasure', rating: 5, review_text: '1923 on the Treasure has incredible atmosphere and service.' },
    { sailing_idx: 7, restaurant_id: 'enchanted-garden', ship: 'Disney Fantasy', rating: 4, review_text: 'Enchanted Garden has great atmosphere, the ceiling transformation is wonderful.' },
    { sailing_idx: 14, restaurant_id: 'palo', ship: 'Disney Wish', rating: 5, dietary_restrictions: ['Gluten-Free'], dietary_accommodation_rating: 5, review_text: 'Palo brunch is always a highlight. They handle dietary restrictions perfectly.' },
  ];

  for (const r of diningReviews) {
    const sailing = sailingIds.kristabel[r.sailing_idx];
    if (!sailing) continue;
    const { error } = await supabase.from('dining_reviews').insert({
      user_id: kristabel,
      sailing_id: sailing.id,
      restaurant_id: r.restaurant_id,
      ship_name: r.ship,
      rating: r.rating,
      review_text: r.review_text,
      dietary_restrictions: r.dietary_restrictions || null,
      dietary_accommodation_rating: r.dietary_accommodation_rating || null,
    });
    if (error) console.error(`  ✗ Dining ${r.restaurant_id}:`, error.message);
  }
  console.log(`  ✓ ${diningReviews.length} dining reviews`);

  // ── Step 5: Activity reviews ───────────────────────────────────
  console.log('\nStep 5: Creating activity reviews...');
  await supabase.from('activity_reviews').delete().eq('user_id', kristabel);

  const activityReviews = [
    { sailing_idx: 13, activity_id: 'aquaduck', ship: 'Disney Wish', rating: 5, age_group: ['All Ages'], review_text: 'AquaDuck is a classic! Never gets old.' },
    { sailing_idx: 7, activity_id: 'pirate-night', ship: 'Disney Fantasy', rating: 5, age_group: ['All Ages'], review_text: 'Pirate Night fireworks on the Fantasy are the best at sea.' },
    { sailing_idx: 21, activity_id: 'pirate-night', ship: 'Disney Treasure', rating: 5, age_group: ['All Ages'], review_text: 'Pirate Night on the Treasure has some new twists!' },
    { sailing_idx: 14, activity_id: 'aquamouse', ship: 'Disney Wish', rating: 4, age_group: ['Kids', 'Teens'], review_text: 'AquaMouse is great but can have long lines midday.' },
  ];

  for (const r of activityReviews) {
    const sailing = sailingIds.kristabel[r.sailing_idx];
    if (!sailing) continue;
    const { error } = await supabase.from('activity_reviews').insert({
      user_id: kristabel,
      sailing_id: sailing.id,
      activity_id: r.activity_id,
      ship_name: r.ship,
      rating: r.rating,
      age_group_recommended: r.age_group,
      review_text: r.review_text,
    });
    if (error) console.error(`  ✗ Activity ${r.activity_id}:`, error.message);
  }
  console.log(`  ✓ ${activityReviews.length} activity reviews`);

  // ── Step 6: Foodie reviews ─────────────────────────────────────
  console.log('\nStep 6: Creating foodie reviews...');
  await supabase.from('foodie_reviews').delete().eq('user_id', kristabel);

  const foodieReviews = [
    { sailing_idx: 21, venue_id: '1923', rating: 5, review_text: '1923 on the Treasure is phenomenal. The ambiance is stunning.' },
    { sailing_idx: 13, venue_id: 'palo', rating: 5, review_text: 'Palo brunch is always a highlight of any cruise.' },
    { sailing_idx: 22, venue_id: '1923', rating: 5, review_text: 'Second time at 1923, still amazing. B2B meant double the indulgence.' },
  ];

  for (const r of foodieReviews) {
    const sailing = sailingIds.kristabel[r.sailing_idx];
    if (!sailing) continue;
    const { error } = await supabase.from('foodie_reviews').insert({
      user_id: kristabel,
      sailing_id: sailing.id,
      venue_id: r.venue_id,
      rating: r.rating,
      review_text: r.review_text,
    });
    if (error) console.error(`  ✗ Foodie ${r.venue_id}:`, error.message);
  }
  console.log(`  ✓ ${foodieReviews.length} foodie reviews`);

  // ── Step 7: Stateroom reviews ──────────────────────────────────
  console.log('\nStep 7: Creating stateroom reviews...');
  await supabase.from('stateroom_reviews').delete().eq('user_id', kristabel);

  const stateroomReviews = [
    { sailing_idx: 13, ship: 'Disney Wish', stateroom: 7122, rating: 5, review_text: 'Deluxe oceanview with verandah. Spacious for two. Great midship location.' },
    { sailing_idx: 21, ship: 'Disney Treasure', stateroom: 9510, rating: 4, review_text: 'Nice verandah stateroom. A bit far aft but great views.' },
    { sailing_idx: 7, ship: 'Disney Fantasy', stateroom: 7230, rating: 5, review_text: 'Category 4A verandah. Perfect location near elevators and pools.' },
  ];

  for (const r of stateroomReviews) {
    const sailing = sailingIds.kristabel[r.sailing_idx];
    if (!sailing) continue;
    const { error } = await supabase.from('stateroom_reviews').insert({
      user_id: kristabel,
      ship_name: r.ship,
      stateroom_number: r.stateroom,
      sail_start_date: sailing.sail_start_date,
      sail_end_date: sailing.sail_end_date,
      stateroom_rating: r.rating,
      num_passengers: sailing.num_pax || 2,
      adults: sailing.adults || 2,
      children: sailing.children || 0,
      infants: 0,
      boarding_port: sailing.embarkation_port,
      departure_port: sailing.embarkation_port,
      review_text: r.review_text,
      sailing_id: sailing.id,
    });
    if (error) console.error(`  ✗ Stateroom ${r.stateroom}:`, error.message);
  }
  console.log(`  ✓ ${stateroomReviews.length} stateroom reviews`);

  // ── Step 8: Character meetups ──────────────────────────────────
  console.log('\nStep 8: Creating character meetups...');
  await supabase.from('character_meetups').delete().eq('user_id', kristabel);

  const meetups = [
    { sailing_idx: 13, character_id: 'mickey-captain', notes: 'Met Captain Mickey at the atrium on embarkation day!', is_default: true },
    { sailing_idx: 13, character_id: 'cinderella', notes: 'Princess gathering near the Grand Hall was magical', is_default: true },
    { sailing_idx: 13, character_id: 'rapunzel', notes: 'Short wait, very interactive', is_default: true },
    { sailing_idx: 21, character_id: 'mickey', notes: 'Classic Mickey at embarkation on the Treasure', is_default: false },
    { sailing_idx: 21, character_id: 'mickey-captain', notes: 'Captain Mickey on the Treasure bridge experience', is_default: false },
    { sailing_idx: 21, character_id: 'goofy', notes: 'Pirate Goofy during Pirate Night', is_default: true },
    { sailing_idx: 7, character_id: 'elsa', notes: 'Frozen meet and greet on the Fantasy', is_default: true },
    { sailing_idx: 7, character_id: 'anna', notes: 'Anna was with Elsa at the meet and greet', is_default: true },
    { sailing_idx: 6, character_id: 'minnie', notes: 'Minnie in her captain outfit!', is_default: true },
  ];

  for (const m of meetups) {
    const sailing = sailingIds.kristabel[m.sailing_idx];
    if (!sailing) continue;
    const { error } = await supabase.from('character_meetups').insert({
      user_id: kristabel,
      sailing_id: sailing.id,
      character_id: m.character_id,
      notes: m.notes,
      is_default: m.is_default,
    });
    if (error) console.error(`  ✗ Character ${m.character_id}:`, error.message);
  }
  console.log(`  ✓ ${meetups.length} character meetups`);

  // ── Step 9: Movie checklist ────────────────────────────────────
  console.log('\nStep 9: Creating movie checklist...');
  await supabase.from('movie_checklist').delete().eq('user_id', kristabel);

  const movies = [
    { movie_id: 'frozen', status: 'watched', rating: 5 },
    { movie_id: 'moana', status: 'watched', rating: 5 },
    { movie_id: 'the-little-mermaid-1989', status: 'watched', rating: 5 },
    { movie_id: 'toy-story', status: 'watched', rating: 4 },
    { movie_id: 'finding-nemo', status: 'watched', rating: 4 },
    { movie_id: 'black-panther', status: 'watched', rating: 4 },
    { movie_id: 'iron-man', status: 'watched', rating: 3 },
    { movie_id: 'snow-white-1937', status: 'watched', rating: 4 },
    { movie_id: 'cinderella', status: 'watched', rating: 5 },
    { movie_id: 'the-lion-king-1994', status: 'watched', rating: 5 },
    { movie_id: 'beauty-and-the-beast-1991', status: 'watched', rating: 5 },
    { movie_id: 'tangled', status: 'watched', rating: 4 },
    { movie_id: 'monsters-inc', status: 'watched', rating: 4 },
    { movie_id: 'up', status: 'watched', rating: 5 },
    { movie_id: 'inside-out', status: 'watched', rating: 5 },
    { movie_id: 'coco', status: 'watched', rating: 5 },
    { movie_id: 'zootopia', status: 'watched', rating: 4 },
    { movie_id: 'encanto', status: 'watched', rating: 4 },
    { movie_id: 'zootopia-2', status: 'want_to_watch', rating: null },
    { movie_id: 'frozen-iii', status: 'want_to_watch', rating: null },
    { movie_id: 'toy-story-5', status: 'want_to_watch', rating: null },
    { movie_id: 'elio', status: 'want_to_watch', rating: null },
    { movie_id: 'coco-2', status: 'want_to_watch', rating: null },
  ];

  for (const m of movies) {
    const { error } = await supabase.from('movie_checklist').upsert({
      user_id: kristabel,
      movie_id: m.movie_id,
      status: m.status,
      rating: m.rating,
    }, { onConflict: 'user_id,movie_id' });
    if (error) console.error(`  ✗ Movie ${m.movie_id}:`, error.message);
  }
  console.log(`  ✓ ${movies.length} movie entries (${movies.filter(m => m.status === 'watched').length} watched, ${movies.filter(m => m.status === 'want_to_watch').length} want to watch)`);

  // ── Step 10: Planner items ─────────────────────────────────────
  console.log('\nStep 10: Creating planner items...');
  await supabase.from('planner_items').delete().eq('user_id', kristabel);

  const upcomingSailing = sailingIds.kristabel[sailingIds.kristabel.length - 1]; // last = upcoming
  const recentPast = sailingIds.kristabel[sailingIds.kristabel.length - 2]; // second to last

  if (upcomingSailing) {
    const upcoming = [
      { item_type: 'venue', item_id: 'palo', checked: false },
      { item_type: 'venue', item_id: 'aquamouse', checked: false },
      { item_type: 'venue', item_id: 'nightingales', checked: false },
      { item_type: 'dining', item_id: 'arendelle', checked: false },
      { item_type: 'dining', item_id: 'worlds-of-marvel', checked: false },
      { item_type: 'dining', item_id: '1923', checked: false },
      { item_type: 'activity', item_id: 'pirate-night', checked: false },
      { item_type: 'activity', item_id: 'aquaduck', checked: false },
      { item_type: 'character', item_id: 'mickey-captain', checked: false },
      { item_type: 'character', item_id: 'cinderella', checked: false },
      { item_type: 'character', item_id: 'rapunzel', checked: false },
      { item_type: 'entertainment', item_id: 'disney-the-wish', checked: false },
    ];
    for (const p of upcoming) {
      await supabase.from('planner_items').insert({ user_id: kristabel, sailing_id: upcomingSailing.id, ...p });
    }
    console.log(`  ✓ ${upcoming.length} planner items for upcoming sailing`);
  }

  if (recentPast) {
    const past = [
      { item_type: 'venue', item_id: 'palo', checked: true },
      { item_type: 'dining', item_id: 'arendelle', checked: true },
      { item_type: 'activity', item_id: 'aquaduck', checked: true },
      { item_type: 'venue', item_id: 'aquamouse', checked: true },
      { item_type: 'character', item_id: 'mickey', checked: true },
    ];
    for (const p of past) {
      await supabase.from('planner_items').insert({ user_id: kristabel, sailing_id: recentPast.id, ...p });
    }
    console.log(`  ✓ ${past.length} checked planner items for recent past sailing`);
  }

  // ── Step 11: Pre-cruise checklist ──────────────────────────────
  console.log('\nStep 11: Creating pre-cruise checklist...');
  await supabase.from('pre_cruise_checklist').delete().eq('user_id', kristabel);

  if (upcomingSailing) {
    const checklist = [
      { category: 'items_to_purchase', label: 'Lanyards for Key to the World cards', checked: true, sort_order: 0 },
      { category: 'items_to_purchase', label: 'Magnetic hooks for stateroom', checked: true, sort_order: 1 },
      { category: 'items_to_purchase', label: 'Power strip (non-surge)', checked: false, sort_order: 2 },
      { category: 'items_to_purchase', label: 'Glow sticks for Pirate Night', checked: false, sort_order: 3 },
      { category: 'items_to_pack', label: 'Formal night outfit', checked: false, sort_order: 0 },
      { category: 'items_to_pack', label: 'Pirate Night bandana', checked: true, sort_order: 1 },
      { category: 'items_to_pack', label: 'Sunscreen SPF 50+', checked: false, sort_order: 2 },
      { category: 'items_to_pack', label: 'Waterproof phone case', checked: false, sort_order: 3 },
      { category: 'items_to_pack', label: 'Autograph book for characters', checked: true, sort_order: 4 },
      { category: 'pixie_dust_prep', label: 'Make welcome bags for FE group', checked: false, sort_order: 0 },
      { category: 'pixie_dust_prep', label: 'Print custom door magnets', checked: false, sort_order: 1 },
      { category: 'pixie_dust_prep', label: 'Write personalized notes', checked: false, sort_order: 2 },
      { category: 'fish_extender', label: 'Buy FE gifts (20 bags needed)', checked: false, sort_order: 0 },
      { category: 'fish_extender', label: 'Make FE hanger with ship theme', checked: false, sort_order: 1 },
      { category: 'fish_extender', label: 'Pack gifts in clear bags', checked: false, sort_order: 2 },
    ];
    for (const c of checklist) {
      await supabase.from('pre_cruise_checklist').insert({ user_id: kristabel, sailing_id: upcomingSailing.id, ...c });
    }
    console.log(`  ✓ ${checklist.length} pre-cruise checklist items`);
  }

  // ── Step 12: FE group + Pixie gifts ────────────────────────────
  console.log('\nStep 12: Creating FE group and pixie gifts...');
  await supabase.from('fe_groups').delete().eq('creator_id', kristabel);
  await supabase.from('pixie_gifts').delete().eq('user_id', kristabel);

  if (upcomingSailing) {
    // FE Group
    const { data: feGroup, error: feErr } = await supabase.from('fe_groups').insert({
      sailing_id: upcomingSailing.id,
      creator_id: kristabel,
      name: 'Wish Magic FE Group',
      invite_code: 'WISH2026',
    }).select().single();

    if (feErr) {
      console.error('  ✗ FE Group:', feErr.message);
    } else {
      console.log(`  ✓ FE Group: "${feGroup.name}" (code: WISH2026)`);
      await supabase.from('fe_group_members').insert({
        group_id: feGroup.id,
        user_id: kristabel,
        stateroom_number: 9112,
      });
      console.log('  ✓ Added kristabelq as FE group member');
    }

    // Pixie Gifts
    const { data: gift1 } = await supabase.from('pixie_gifts').insert({
      user_id: kristabel,
      sailing_id: upcomingSailing.id,
      name: 'Welcome Aboard Bags',
      emoji: '🎁',
      color: '#8B5CF6',
      sort_order: 0,
    }).select().single();

    if (gift1) {
      console.log(`  ✓ Gift: "${gift1.name}"`);
      const recipients = [9200, 9202, 9204, 9206, 9208].map(n => ({
        gift_id: gift1.id,
        stateroom_number: n,
      }));
      await supabase.from('pixie_gift_recipients').insert(recipients);
      console.log(`  ✓ ${recipients.length} gift recipients added`);

      // Mark 2 as delivered
      const { data: rows } = await supabase
        .from('pixie_gift_recipients')
        .select('id')
        .eq('gift_id', gift1.id)
        .limit(2);
      for (const r of (rows || [])) {
        await supabase.from('pixie_gift_recipients').update({
          delivered: true, delivered_at: new Date().toISOString(),
        }).eq('id', r.id);
      }
      console.log('  ✓ 2 recipients marked as delivered');
    }

    const { data: gift2 } = await supabase.from('pixie_gifts').insert({
      user_id: kristabel,
      sailing_id: upcomingSailing.id,
      name: 'Door Magnets',
      emoji: '🧲',
      color: '#EC4899',
      sort_order: 1,
    }).select().single();
    if (gift2) console.log(`  ✓ Gift: "${gift2.name}"`);
  }

  // ── Step 13: Adventure rotation ────────────────────────────────
  console.log('\nStep 13: Creating adventure rotation...');
  await supabase.from('adventure_rotations').delete().eq('user_id', kristabel);

  if (upcomingSailing) {
    await supabase.from('adventure_rotations').insert({
      user_id: kristabel,
      sailing_id: upcomingSailing.id,
      rotation: 1,
    });
    console.log('  ✓ Rotation 1 for upcoming sailing');
  }

  // ── Step 14: Cruise hack reviews ───────────────────────────────
  console.log('\nStep 14: Creating cruise hack reviews...');
  await supabase.from('cruise_hack_reviews').delete().eq('user_id', kristabel);

  const hacks = [
    { ship_name: 'Disney Wish', category: 'stateroom', title: 'Magnetic hooks', hack_text: 'Bring magnetic hooks to hang bags and accessories on the stateroom walls. The walls are metal!', verdict: 'Must Try', rating: 5, review_text: 'Game changer for organization.' },
    { ship_name: null, category: 'packing', title: 'Non-surge power strip', hack_text: 'Bring a non-surge power strip. Surge protectors are not allowed but regular power strips are.', verdict: 'Must Try', rating: 5, review_text: 'Essential. Only one outlet in the room otherwise.' },
    { ship_name: 'Disney Treasure', category: 'dining', title: 'Skip the MDR dessert', hack_text: 'Order room service desserts instead - they have items not on the dining room menu.', verdict: 'Worth It', rating: 4, review_text: 'The chocolate cake from room service is incredible.' },
  ];

  for (const h of hacks) {
    const { error } = await supabase.from('cruise_hack_reviews').insert({
      user_id: kristabel,
      ...h,
    });
    if (error) console.error(`  ✗ Hack "${h.title}":`, error.message);
  }
  console.log(`  ✓ ${hacks.length} cruise hack reviews`);

  // ── Done! ──────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(55));
  console.log('SEED COMPLETE!');
  console.log('='.repeat(55));
  console.log(`\nKristabelQ (${kristabel})`);
  console.log('  Sailings: 26 past + 1 upcoming = 27 total');
  console.log('  Includes B2B: Treasure Jan 5-12 + Jan 12-19');
  console.log('  Venue reviews: 7 across Wish, Fantasy, Treasure');
  console.log('  Dining reviews: 6 across multiple restaurants');
  console.log('  Activity reviews: 4 (AquaDuck, Pirate Night, AquaMouse)');
  console.log('  Foodie reviews: 3 (1923, Palo)');
  console.log('  Stateroom reviews: 3');
  console.log('  Character meetups: 9 across 4 sailings');
  console.log('  Movie checklist: 23 entries (18 watched, 5 want to watch)');
  console.log('  Planner items: 12 upcoming + 5 past checked');
  console.log('  Pre-cruise checklist: 15 items');
  console.log('  FE group: Wish Magic (code WISH2026)');
  console.log('  Pixie gifts: 2 gifts, 5 recipients (2 delivered)');
  console.log('  Cruise hacks: 3 reviews');
  console.log('  Adventure rotation: Rotation 1');

  if (!multiUser) {
    console.log('\n── Multi-User Testing ──');
    console.log('To test multi-user scenarios (companions, follows, friends):');
    console.log('1. Create accounts through the app signup or Supabase dashboard');
    console.log('2. Update USERS map in this script with their UUIDs');
    console.log('3. Set SINGLE_USER_MODE = false');
    console.log('4. Re-run this script');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
