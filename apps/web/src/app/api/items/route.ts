import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return proxyToServer(req, "/api/items");
}
