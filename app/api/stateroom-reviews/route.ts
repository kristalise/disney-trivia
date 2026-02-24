import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase(authHeader?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

const VALID_SHIPS = [
  'Disney Magic',
  'Disney Wonder',
  'Disney Dream',
  'Disney Fantasy',
  'Disney Wish',
  'Disney Treasure',
  'Disney Destiny',
  'Disney Adventure',
];

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ship = searchParams.get('ship');
    const room = searchParams.get('room');

    if (!ship || !room) {
      return NextResponse.json(
        { error: 'ship and room query parameters are required' },
        { status: 400 }
      );
    }

    const roomNum = parseInt(room, 10);
    if (isNaN(roomNum)) {
      return NextResponse.json(
        { error: 'room must be a valid number' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ reviews: [], averageStateroomRating: null, averageSailingRating: null, totalReviews: 0 });
    }

    const { data: reviews, error } = await supabase
      .from('stateroom_reviews')
      .select('id, ship_name, stateroom_number, sail_start_date, sail_end_date, stateroom_rating, sailing_rating, num_passengers, adults, children, infants, occasions, boarding_port, ports_of_call, departure_port, purchased_from, price_paid, review_text, created_at')
      .eq('ship_name', ship)
      .eq('stateroom_number', roomNum)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalReviews = reviews?.length ?? 0;
    const averageStateroomRating =
      totalReviews > 0
        ? Math.round((reviews!.reduce((sum, r) => sum + r.stateroom_rating, 0) / totalReviews) * 10) / 10
        : null;
    const sailingRatings = reviews?.filter((r) => r.sailing_rating != null) ?? [];
    const averageSailingRating =
      sailingRatings.length > 0
        ? Math.round((sailingRatings.reduce((sum, r) => sum + r.sailing_rating, 0) / sailingRatings.length) * 10) / 10
        : null;

    return NextResponse.json({ reviews: reviews ?? [], averageStateroomRating, averageSailingRating, totalReviews });
  } catch (error) {
    console.error('Error fetching stateroom reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { allowed } = checkRateLimit(`stateroom-review:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabase(authHeader);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      ship_name,
      stateroom_number,
      sail_start_date,
      sail_end_date,
      stateroom_rating,
      sailing_rating,
      num_passengers,
      boarding_port,
      ports_of_call,
      departure_port,
      purchased_from,
      price_paid,
      adults,
      children,
      infants,
      occasions,
      review_text,
    } = body;

    // Validate required fields
    if (!ship_name || !stateroom_number || !sail_start_date || !sail_end_date || !stateroom_rating || !sailing_rating || !num_passengers || !boarding_port || !departure_port) {
      return NextResponse.json(
        { error: 'All fields are required except ports of call and review text' },
        { status: 400 }
      );
    }

    // Validate ship
    if (!VALID_SHIPS.includes(ship_name)) {
      return NextResponse.json(
        { error: 'Invalid ship name' },
        { status: 400 }
      );
    }

    // Validate stateroom_rating
    const stateroomRatingNum = Number(stateroom_rating);
    if (!Number.isInteger(stateroomRatingNum) || stateroomRatingNum < 1 || stateroomRatingNum > 5) {
      return NextResponse.json(
        { error: 'Stateroom rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate sailing_rating
    const sailingRatingNum = Number(sailing_rating);
    if (!Number.isInteger(sailingRatingNum) || sailingRatingNum < 1 || sailingRatingNum > 5) {
      return NextResponse.json(
        { error: 'Sailing rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate stateroom number
    const roomNum = Number(stateroom_number);
    if (!Number.isInteger(roomNum) || roomNum <= 0) {
      return NextResponse.json(
        { error: 'stateroom_number must be a positive integer' },
        { status: 400 }
      );
    }

    // Validate num_passengers
    const paxNum = Number(num_passengers);
    if (!Number.isInteger(paxNum) || paxNum < 1 || paxNum > 20) {
      return NextResponse.json(
        { error: 'Number of passengers must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Validate age group counts
    const adultsNum = adults != null ? Number(adults) : 0;
    const childrenNum = children != null ? Number(children) : 0;
    const infantsNum = infants != null ? Number(infants) : 0;
    if ([adultsNum, childrenNum, infantsNum].some((v) => !Number.isInteger(v) || v < 0 || v > 20)) {
      return NextResponse.json(
        { error: 'Age group counts must be non-negative integers up to 20' },
        { status: 400 }
      );
    }
    if (adultsNum + childrenNum + infantsNum !== paxNum) {
      return NextResponse.json(
        { error: 'Age group counts must add up to total passengers' },
        { status: 400 }
      );
    }

    // Validate occasions
    const VALID_OCCASIONS = ['Birthday', 'Anniversary', 'Honeymoon', 'Family Vacation', 'Holiday', 'Graduation', 'Just for Fun', 'Babymoon', 'Reunion', 'Other'];
    const occasionsList: string[] = Array.isArray(occasions) ? occasions : [];
    if (occasionsList.length > 0 && !occasionsList.every((o: string) => VALID_OCCASIONS.includes(o))) {
      return NextResponse.json(
        { error: 'Invalid occasion selected' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(sail_start_date);
    const endDate = new Date(sail_end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Dates must be valid' },
        { status: 400 }
      );
    }
    if (endDate > new Date()) {
      return NextResponse.json(
        { error: 'Sail end date cannot be in the future' },
        { status: 400 }
      );
    }
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Sail end date must be after start date' },
        { status: 400 }
      );
    }

    // Validate price_paid if provided
    if (price_paid != null && price_paid !== '') {
      const priceNum = Number(price_paid);
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json(
          { error: 'Price paid must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Sanitize text fields
    const sanitizedPurchasedFrom = purchased_from
      ? stripHtml(String(purchased_from)).slice(0, 200)
      : null;
    const sanitizedPricePaid = price_paid != null && price_paid !== ''
      ? Number(price_paid)
      : null;
    const sanitizedReviewText = review_text
      ? stripHtml(String(review_text)).slice(0, 1000)
      : null;
    const sanitizedBoardingPort = stripHtml(String(boarding_port)).slice(0, 100);
    const sanitizedPortsOfCall = ports_of_call
      ? stripHtml(String(ports_of_call)).slice(0, 500)
      : null;
    const sanitizedDeparturePort = stripHtml(String(departure_port)).slice(0, 100);

    if (!sanitizedBoardingPort || !sanitizedDeparturePort) {
      return NextResponse.json(
        { error: 'Boarding port and departure port cannot be empty' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('stateroom_reviews')
      .insert({
        user_id: user.id,
        ship_name,
        stateroom_number: roomNum,
        sail_start_date,
        sail_end_date,
        stateroom_rating: stateroomRatingNum,
        sailing_rating: sailingRatingNum,
        num_passengers: paxNum,
        adults: adultsNum,
        children: childrenNum,
        infants: infantsNum,
        occasions: occasionsList.length > 0 ? occasionsList.join(',') : null,
        boarding_port: sanitizedBoardingPort,
        ports_of_call: sanitizedPortsOfCall || null,
        departure_port: sanitizedDeparturePort,
        purchased_from: sanitizedPurchasedFrom || null,
        price_paid: sanitizedPricePaid,
        review_text: sanitizedReviewText || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reviewed this stateroom for this sailing' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully!',
      review: data,
    });
  } catch (error) {
    console.error('Error submitting stateroom review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
