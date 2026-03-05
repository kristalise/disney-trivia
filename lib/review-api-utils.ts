import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabase(authHeader?: string | null): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

export const VALID_SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export function validateRating(value: unknown, fieldName: string): { valid: true; value: number } | { valid: false; error: NextResponse } {
  if (value == null) return { valid: true, value: 0 };
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return { valid: false, error: NextResponse.json({ error: `${fieldName} must be an integer between 1 and 5` }, { status: 400 }) };
  }
  return { valid: true, value: num };
}

export function validateSocialUrls(body: Record<string, unknown>): { valid: true; urls: Record<string, string | null> } | { valid: false; error: NextResponse } {
  const fields = ['instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url'] as const;
  const result: Record<string, string | null> = {};
  for (const field of fields) {
    const val = body[field];
    if (val) {
      if (!String(val).startsWith('https://')) {
        return { valid: false, error: NextResponse.json({ error: `${field} must start with https://` }, { status: 400 }) };
      }
      result[field] = stripHtml(String(val)).slice(0, 500);
    }
  }
  return { valid: true, urls: result };
}

export async function requireAuth(supabase: SupabaseClient): Promise<{ user: { id: string }; error?: never } | { user?: never; error: NextResponse }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 }) };
  }
  return { user };
}

export async function enrichWithProfiles<T extends { user_id: string }>(
  supabase: SupabaseClient,
  reviews: T[]
): Promise<(T & { reviewer_name: string; reviewer_avatar: string | null; reviewer_id: string; reviewer_handle: string | null })[]> {
  const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    return reviews.map(r => ({
      ...r,
      reviewer_name: 'Anonymous',
      reviewer_avatar: null,
      reviewer_id: r.user_id,
      reviewer_handle: null,
    }));
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, avatar_url, handle')
    .in('id', userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  return reviews.map(r => ({
    ...r,
    reviewer_name: profileMap[r.user_id]?.display_name || 'Anonymous',
    reviewer_avatar: profileMap[r.user_id]?.avatar_url || null,
    reviewer_id: r.user_id,
    reviewer_handle: profileMap[r.user_id]?.handle || null,
  }));
}

export async function enrichWithSailingContext<T extends { sailing_id?: string | null }>(
  supabase: SupabaseClient,
  reviews: T[]
): Promise<(T & { sailing_ship: string | null; sailing_start: string | null; sailing_itinerary: string | null })[]> {
  const sailingIds = [...new Set(reviews.map(r => r.sailing_id).filter(Boolean))] as string[];
  if (sailingIds.length === 0) {
    return reviews.map(r => ({
      ...r,
      sailing_ship: null,
      sailing_start: null,
      sailing_itinerary: null,
    }));
  }

  const { data: sailingData } = await supabase
    .from('sailing_reviews')
    .select('id, ship_name, sail_start_date, itinerary_name')
    .in('id', sailingIds);

  const sailingMap = Object.fromEntries((sailingData ?? []).map(s => [s.id, s]));
  return reviews.map(r => ({
    ...r,
    sailing_ship: r.sailing_id ? sailingMap[r.sailing_id]?.ship_name || null : null,
    sailing_start: r.sailing_id ? sailingMap[r.sailing_id]?.sail_start_date || null : null,
    sailing_itinerary: r.sailing_id ? sailingMap[r.sailing_id]?.itinerary_name || null : null,
  }));
}
