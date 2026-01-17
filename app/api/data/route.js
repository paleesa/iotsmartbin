import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Weather config
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const CITY = 'Penang'; // change if needed

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('smart_bin_db');

    // --- Latest Reading ---
    const latest = await db
      .collection('readings')
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    // --- History ---
    const history = await db
      .collection('readings')
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // --- Weather Fetch (EXTERNAL API) ---
    const weatherRes = await fetch(
      `${WEATHER_URL}?q=${CITY}&units=metric&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}`
    );

    const weatherJson = await weatherRes.json();

    const weather = {
      temp: weatherJson.main?.temp ?? null,
      humidity: weatherJson.main?.humidity ?? null,
      condition: weatherJson.weather?.[0]?.main ?? 'Unknown'
    };

    return NextResponse.json({
      current: latest[0] || {
        level: 0,
        motion: false,
        temperature: 0,
        humidity: 0,
        timestamp: new Date()
      },
      history: history.reverse(),
      weather
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
