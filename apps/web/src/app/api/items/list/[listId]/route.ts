import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  return proxyToServer(req, `/api/items/list/${listId}`);
}
