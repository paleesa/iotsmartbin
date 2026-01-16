import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure it doesn't cache old data

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("smart_bin_db");

    // Get the Single Latest reading (for the big display)
    const latest = await db.collection("readings")
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    // Get History (last 20 readings for the chart)
    const history = await db.collection("readings")
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ 
      current: latest[0] || { level: 0, motion: false }, 
      history: history.reverse() 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}