import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return proxyToServer(req, "/api/auth/me");
}
