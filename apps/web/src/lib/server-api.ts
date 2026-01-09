import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const SERVER_API_URL =
  process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_SERVER_API_URL;

const JSON_CONTENT = "application/json";

const isJsonResponse = (contentType: string | null) =>
  contentType?.includes("application/json");

export async function proxyToServer(req: NextRequest, path: string) {
  if (!SERVER_API_URL) {
    return NextResponse.json(
      { error: "SERVER_API_URL not configured" },
      { status: 500 },
    );
  }

  const session = await auth();
  const token = await session.getToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUrl = `${SERVER_API_URL}${path}${req.nextUrl.search || ""}`;

  const method = req.method?.toUpperCase() || "GET";
  const hasBody = !["GET", "HEAD"].includes(method);

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": req.headers.get("content-type") || JSON_CONTENT,
    },
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  };

  try {
    const upstream = await fetch(targetUrl, init);
    return await forwardResponse(upstream);
  } catch (error) {
    console.error("BFF proxy error:", error);
    return NextResponse.json(
      { error: "Failed to reach backend service" },
      { status: 502 },
    );
  }
}

async function forwardResponse(upstream: Response): Promise<NextResponse> {
  const contentType = upstream.headers.get("content-type");
  const status = upstream.status;

  if (isJsonResponse(contentType)) {
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data, { status });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
}
