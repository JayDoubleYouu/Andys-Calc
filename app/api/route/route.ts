import { NextRequest, NextResponse } from 'next/server';

const ORS_TIMEOUT_MS = 15000;
const ORS_MAX_RETRIES = 3;
const ORS_RETRY_DELAY_MS = 800;

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

  // Get API key from environment variable (trim to avoid copy-paste issues)
  const rawKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  const API_KEY = rawKey?.trim();
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured. Please set NEXT_PUBLIC_ORS_API_KEY environment variable. See VERCEL_SETUP.md for instructions.' },
      { status: 500 }
    );
  }
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${encodeURIComponent(API_KEY)}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= ORS_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS);
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: 'API key invalid or expired. Please get a free key from openrouteservice.org' },
            { status: response.status }
          );
        }
        // Retry on 429 (rate limit) or 5xx
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(errorMsg);
          if (attempt < ORS_MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, ORS_RETRY_DELAY_MS * attempt));
            continue;
          }
          return NextResponse.json(
            { error: `Route service temporarily unavailable (${errorMsg}). Please try again in a moment.` },
            { status: 502 }
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
    } catch (err: unknown) {
      lastError = err;
      const isRetryable =
        err instanceof Error &&
        (err.name === 'AbortError' || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network'));
      if (isRetryable && attempt < ORS_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, ORS_RETRY_DELAY_MS * attempt));
        continue;
      }
      const message = err instanceof Error ? err.message : 'Failed to calculate route';
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      return NextResponse.json(
        {
          error: isTimeout
            ? 'Route service took too long to respond. Please try again.'
            : message.includes('fetch') || message.includes('network')
              ? 'Unable to reach route service. Check your connection and try again.'
              : message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: lastError instanceof Error ? lastError.message : 'Failed to calculate route. Please try again.' },
    { status: 500 }
  );
}
