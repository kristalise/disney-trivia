import { NextRequest, NextResponse } from 'next/server';
import { optimizeDeliveryRoute } from '@/lib/route-optimizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start_stateroom, target_staterooms } = body;

    if (!start_stateroom || !target_staterooms || !Array.isArray(target_staterooms)) {
      return NextResponse.json({ error: 'start_stateroom and target_staterooms are required' }, { status: 400 });
    }

    const startRoom = Number(start_stateroom);
    const targets = target_staterooms.map(Number).filter(n => !isNaN(n) && n >= 1000);

    if (isNaN(startRoom) || startRoom < 1000) {
      return NextResponse.json({ error: 'Invalid start_stateroom' }, { status: 400 });
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: 'No valid target staterooms' }, { status: 400 });
    }

    const route = optimizeDeliveryRoute(startRoom, targets);

    return NextResponse.json({ route, start_stateroom: startRoom });
  } catch (error) {
    console.error('Error optimizing route:', error);
    return NextResponse.json({ error: 'Failed to optimize route' }, { status: 500 });
  }
}
