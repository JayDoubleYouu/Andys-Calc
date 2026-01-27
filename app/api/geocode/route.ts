import { NextRequest, NextResponse } from 'next/server';

// Proxy route for postcode geocoding to avoid CORS issues
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postcode = searchParams.get('postcode');

  if (!postcode) {
    return NextResponse.json(
      { error: 'Postcode parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Clean postcode - remove spaces and convert to uppercase
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
    
    // Always parse JSON, even if response is not ok (terminated postcodes return 404 with data)
    const data = await response.json().catch(() => ({}));

    // Handle terminated postcodes - they return 404 but include coordinates in terminated object
    if (data.status === 404 && data.terminated) {
      if (data.terminated.latitude && data.terminated.longitude) {
        return NextResponse.json({
          latitude: data.terminated.latitude,
          longitude: data.terminated.longitude,
        });
      }
    }

    // Handle normal successful responses
    if (data.status === 200 && data.result) {
      if (!data.result.latitude || !data.result.longitude) {
        return NextResponse.json(
          { error: 'Invalid coordinates returned for postcode' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      });
    }

    // Handle other error cases
    return NextResponse.json(
      { error: data.error || `Postcode lookup failed: ${response.status}` },
      { status: response.ok ? 200 : response.status }
    );
  } catch (error: any) {
    console.error('Error geocoding postcode:', error);
    return NextResponse.json(
      { error: `Failed to geocode postcode: ${postcode}` },
      { status: 500 }
    );
  }
}
