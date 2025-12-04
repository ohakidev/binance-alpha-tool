import { NextResponse } from "next/server";

/**
 * API Proxy Route - Forwards requests to alpha123.uk from client-side
 *
 * This endpoint acts as a simple proxy to bypass CORS restrictions
 * The actual fetching should be done from client-side to avoid bot detection
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { success: false, error: "URL parameter is required" },
      { status: 400 },
    );
  }

  try {
    // This is a simple proxy that forwards the request
    // Note: This may still face 403 errors from server-side
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
