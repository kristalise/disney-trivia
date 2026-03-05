import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { isValidStateroomForShip } from '@/lib/stateroom-utils';
import { getSupabase, VALID_SHIPS, stripHtml, requireAuth, enrichWithProfiles } from '@/lib/review-api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ship = searchParams.get('ship');

    if (!ship) {
      return NextResponse.json({ error: 'ship query parameter is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ reviews: [], averageRatings: null, totalReviews: 0 });
    }

    const { data: reviews, error } = await supabase
      .from('sailing_reviews')
      .select('id, ship_name, sail_start_date, sail_end_date, itinerary_name, embarkation_port, ports_of_call, stateroom_numbers, num_pax, cost_per_pax, overall_rating, service_rating, entertainment_rating, food_rating, review_text, photo_url, user_id, created_at')
      .eq('ship_name', ship)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ratedReviews = (reviews ?? []).filter(r => r.overall_rating != null);
    const totalReviews = reviews?.length ?? 0;
    let averageRatings = null;
    if (ratedReviews.length > 0) {
      const avg = (field: string) =>
        Math.round((ratedReviews.reduce((sum, r) => sum + (r as Record<string, number>)[field], 0) / ratedReviews.length) * 10) / 10;
      averageRatings = {
        overall: avg('overall_rating'),
        service: avg('service_rating'),
        entertainment: avg('entertainment_rating'),
        food: avg('food_rating'),
      };
    }

    // Enrich with reviewer profiles
    const enrichedReviews = await enrichWithProfiles(supabase, reviews ?? []);

    return NextResponse.json({ reviews: enrichedReviews, averageRatings, totalReviews });
  } catch (error) {
    console.error('Error fetching sailing reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`sailing-review:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const authResult = await requireAuth(supabase);
    if (authResult.error) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const {
      ship_name, sail_start_date, sail_end_date, itinerary_name, embarkation_port,
      ports_of_call, stateroom_numbers, num_pax, cost_per_pax,
      overall_rating, service_rating, entertainment_rating, food_rating,
      review_text, photo_url,
      adults, children, infants, occasions, purchased_from, total_cost, disembarkation_port,
    } = body;

    if (!ship_name || !sail_start_date || !sail_end_date || !embarkation_port) {
      return NextResponse.json({ error: 'Ship, dates, and embarkation port are required' }, { status: 400 });
    }
    if (!VALID_SHIPS.includes(ship_name)) {
      return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
    }

    const startDate = new Date(sail_start_date);
    const endDate = new Date(sail_end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Dates must be valid' }, { status: 400 });
    }
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'Sail end date must be after start date' }, { status: 400 });
    }

    // Check for overlapping sailings (B2B allowed: end date == start date)
    const { data: existingSailings } = await supabase
      .from('sailing_reviews')
      .select('id, sail_start_date, sail_end_date, ship_name')
      .eq('user_id', user.id);

    if (existingSailings && existingSailings.length > 0) {
      const newStart = new Date(sail_start_date + 'T00:00:00');
      const newEnd = new Date(sail_end_date + 'T00:00:00');
      for (const s of existingSailings) {
        const existStart = new Date(s.sail_start_date + 'T00:00:00');
        const existEnd = new Date(s.sail_end_date + 'T00:00:00');
        // Overlap if ranges intersect, but allow B2B (end == start)
        const overlaps = newStart < existEnd && newEnd > existStart;
        const isB2B = newStart.getTime() === existEnd.getTime() || newEnd.getTime() === existStart.getTime();
        if (overlaps && !isB2B) {
          return NextResponse.json({
            error: `Dates overlap with your existing ${s.ship_name} sailing (${s.sail_start_date} to ${s.sail_end_date}). Back-to-back sailings are allowed when the end date matches the next start date.`,
          }, { status: 400 });
        }
      }
    }

    // Ratings are always optional at creation time — users review later via PATCH
    for (const [name, val] of Object.entries({ overall_rating, service_rating, entertainment_rating, food_rating })) {
      if (val != null) {
        const num = Number(val);
        if (!Number.isInteger(num) || num < 1 || num > 5) {
          return NextResponse.json({ error: `${name} must be an integer between 1 and 5` }, { status: 400 });
        }
      }
    }

    // Validate optional new fields
    if (stateroom_numbers != null) {
      if (!Array.isArray(stateroom_numbers) || !stateroom_numbers.every((n: unknown) => Number.isInteger(Number(n)) && Number(n) > 0)) {
        return NextResponse.json({ error: 'stateroom_numbers must be an array of positive integers' }, { status: 400 });
      }
      // Validate each stateroom exists on the ship
      for (const num of stateroom_numbers) {
        if (!isValidStateroomForShip(Number(num), ship_name)) {
          return NextResponse.json({ error: `Room ${num} doesn't exist on ${ship_name}` }, { status: 400 });
        }
      }
    }
    if (num_pax != null) {
      const pax = Number(num_pax);
      if (!Number.isInteger(pax) || pax < 1 || pax > 20) {
        return NextResponse.json({ error: 'num_pax must be an integer between 1 and 20' }, { status: 400 });
      }
    }
    if (cost_per_pax != null) {
      const cost = Number(cost_per_pax);
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json({ error: 'cost_per_pax must be a positive number' }, { status: 400 });
      }
    }

    // Validate new passenger breakdown fields
    if (adults != null) {
      const a = Number(adults);
      if (!Number.isInteger(a) || a < 0 || a > 20) {
        return NextResponse.json({ error: 'adults must be a non-negative integer up to 20' }, { status: 400 });
      }
    }
    if (children != null) {
      const c = Number(children);
      if (!Number.isInteger(c) || c < 0 || c > 20) {
        return NextResponse.json({ error: 'children must be a non-negative integer up to 20' }, { status: 400 });
      }
    }
    if (infants != null) {
      const i = Number(infants);
      if (!Number.isInteger(i) || i < 0 || i > 20) {
        return NextResponse.json({ error: 'infants must be a non-negative integer up to 20' }, { status: 400 });
      }
    }
    if (total_cost != null) {
      const tc = Number(total_cost);
      if (isNaN(tc) || tc < 0) {
        return NextResponse.json({ error: 'total_cost must be a positive number' }, { status: 400 });
      }
    }

    const VALID_OCCASIONS = ['Birthday', 'Anniversary', 'Honeymoon', 'Family Vacation', 'Holiday', 'Graduation', 'Just for Fun', 'Babymoon', 'Reunion', 'Other'];
    const occasionsList: string[] = Array.isArray(occasions) ? occasions : [];
    if (occasionsList.length > 0 && !occasionsList.every((o: string) => VALID_OCCASIONS.includes(o))) {
      return NextResponse.json({ error: 'Invalid occasion selected' }, { status: 400 });
    }

    // Compute num_pax and cost_per_pax from new fields if not directly provided
    let computedNumPax = num_pax != null ? Number(num_pax) : null;
    let computedCostPerPax = cost_per_pax != null ? Number(cost_per_pax) : null;
    if (computedNumPax == null && (adults != null || children != null || infants != null)) {
      computedNumPax = (Number(adults) || 0) + (Number(children) || 0) + (Number(infants) || 0);
    }
    if (computedCostPerPax == null && total_cost != null && computedNumPax && computedNumPax > 0) {
      computedCostPerPax = Number(total_cost) / computedNumPax;
    }

    const { data, error } = await supabase
      .from('sailing_reviews')
      .insert({
        user_id: user.id,
        ship_name,
        sail_start_date,
        sail_end_date,
        itinerary_name: itinerary_name ? stripHtml(String(itinerary_name)).slice(0, 200) : null,
        embarkation_port: stripHtml(String(embarkation_port)).slice(0, 100),
        ports_of_call: ports_of_call ? stripHtml(String(ports_of_call)).slice(0, 500) : null,
        stateroom_numbers: stateroom_numbers ? stateroom_numbers.map(Number) : null,
        num_pax: computedNumPax,
        cost_per_pax: computedCostPerPax,
        overall_rating: overall_rating != null ? Number(overall_rating) : null,
        service_rating: service_rating != null ? Number(service_rating) : null,
        entertainment_rating: entertainment_rating != null ? Number(entertainment_rating) : null,
        food_rating: food_rating != null ? Number(food_rating) : null,
        review_text: review_text ? stripHtml(String(review_text)).slice(0, 1000) : null,
        photo_url: photo_url ? String(photo_url).slice(0, 500) : null,
        adults: adults != null ? Number(adults) : null,
        children: children != null ? Number(children) : null,
        infants: infants != null ? Number(infants) : null,
        occasions: occasionsList.length > 0 ? occasionsList.join(',') : null,
        purchased_from: purchased_from ? stripHtml(String(purchased_from)).slice(0, 200) : null,
        total_cost: total_cost != null ? Number(total_cost) : null,
        disembarkation_port: disembarkation_port ? stripHtml(String(disembarkation_port)).slice(0, 100) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review submitted successfully!', review: data });
  } catch (error) {
    console.error('Error submitting sailing review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const authResult = await requireAuth(supabase);
    if (authResult.error) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('sailing_reviews')
      .select('user_id, sail_end_date')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own sailings' }, { status: 403 });
    }

    // Build update object from provided fields
    const updates: Record<string, unknown> = {};

    if (body.ship_name !== undefined) {
      if (!VALID_SHIPS.includes(body.ship_name)) {
        return NextResponse.json({ error: 'Invalid ship name' }, { status: 400 });
      }
      updates.ship_name = body.ship_name;
    }
    if (body.sail_start_date !== undefined) updates.sail_start_date = body.sail_start_date;
    if (body.sail_end_date !== undefined) updates.sail_end_date = body.sail_end_date;
    if (body.itinerary_name !== undefined) updates.itinerary_name = body.itinerary_name ? stripHtml(String(body.itinerary_name)).slice(0, 200) : null;
    if (body.embarkation_port !== undefined) updates.embarkation_port = stripHtml(String(body.embarkation_port)).slice(0, 100);
    if (body.disembarkation_port !== undefined) updates.disembarkation_port = body.disembarkation_port ? stripHtml(String(body.disembarkation_port)).slice(0, 100) : null;
    if (body.ports_of_call !== undefined) updates.ports_of_call = body.ports_of_call ? stripHtml(String(body.ports_of_call)).slice(0, 500) : null;
    if (body.stateroom_numbers !== undefined) updates.stateroom_numbers = Array.isArray(body.stateroom_numbers) ? body.stateroom_numbers.map(Number) : null;
    if (body.adults !== undefined) updates.adults = body.adults != null ? Number(body.adults) : null;
    if (body.children !== undefined) updates.children = body.children != null ? Number(body.children) : null;
    if (body.infants !== undefined) updates.infants = body.infants != null ? Number(body.infants) : null;
    if (body.occasions !== undefined) updates.occasions = Array.isArray(body.occasions) && body.occasions.length > 0 ? body.occasions.join(',') : null;
    if (body.purchased_from !== undefined) updates.purchased_from = body.purchased_from ? stripHtml(String(body.purchased_from)).slice(0, 200) : null;
    if (body.total_cost !== undefined) updates.total_cost = body.total_cost != null ? Number(body.total_cost) : null;
    if (body.review_text !== undefined) updates.review_text = body.review_text ? stripHtml(String(body.review_text)).slice(0, 1000) : null;

    // Ratings (validate if provided)
    for (const field of ['overall_rating', 'service_rating', 'entertainment_rating', 'food_rating'] as const) {
      if (body[field] !== undefined) {
        if (body[field] === null) {
          updates[field] = null;
        } else {
          const num = Number(body[field]);
          if (!Number.isInteger(num) || num < 1 || num > 5) {
            return NextResponse.json({ error: `${field} must be an integer between 1 and 5` }, { status: 400 });
          }
          updates[field] = num;
        }
      }
    }

    // Recompute num_pax and cost_per_pax if passenger/cost fields changed
    if (body.adults !== undefined || body.children !== undefined || body.infants !== undefined) {
      const a = updates.adults != null ? Number(updates.adults) : 0;
      const c = updates.children != null ? Number(updates.children) : 0;
      const i = updates.infants != null ? Number(updates.infants) : 0;
      updates.num_pax = a + c + i > 0 ? a + c + i : null;
    }
    if (body.total_cost !== undefined && updates.num_pax) {
      updates.cost_per_pax = Number(updates.total_cost) / Number(updates.num_pax);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sailing_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    console.error('Error updating sailing review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const authResult = await requireAuth(supabase);
    if (authResult.error) return authResult.error;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('sailing_reviews')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own sailings' }, { status: 403 });
    }

    const { error } = await supabase
      .from('sailing_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sailing review:', error);
    return NextResponse.json({ error: 'Failed to delete sailing' }, { status: 500 });
  }
}
