import { NextRequest, NextResponse } from 'next/server';

// Proxy route for OpenRouteService to avoid CORS issues
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromLat = searchParams.get('fromLat');
  const fromLng = searchParams.get('fromLng');
  const toLat = searchParams.get('toLat');
  const toLng = searchParams.get('toLng');

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Get API key from environment variable
  // For Vercel: Set in Settings → Environment Variables
  // For local dev: Set in .env.local file (already configured)
  const API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured. Please set NEXT_PUBLIC_ORS_API_KEY environment variable. See VERCEL_SETUP.md for instructions.' },
      { status: 500 }
    );
  }
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'API key invalid or expired. Please get a free key from openrouteservice.org' },
          { status: response.status }
        );
      }
      return NextResponse.json(
        { error: `Route API error: ${errorMsg}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for error in response
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'API returned an error' },
        { status: 400 }
      );
    }

    // OpenRouteService GET returns GeoJSON format
    if (!data.features || !data.features[0] || !data.features[0].properties) {
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      );
    }

    const properties = data.features[0].properties;
    const summary = properties.summary || properties;
    const distanceMeters = summary.distance || 0;
    const durationSeconds = summary.duration || 0;

    if (distanceMeters === 0 || durationSeconds === 0) {
      return NextResponse.json(
        { error: 'Route calculation returned zero distance or duration' },
        { status: 400 }
      );
    }

    // Convert meters to miles (1 meter = 0.000621371 miles)
    const distanceMiles = distanceMeters * 0.000621371;
    // Convert seconds to minutes
    const durationMinutes = durationSeconds / 60;

    return NextResponse.json({
      distance: Math.round(distanceMiles * 10) / 10,
      duration: Math.round(durationMinutes),
    });
  } catch (error: any) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate route' },
      { status: 500 }
    );
  }
}
