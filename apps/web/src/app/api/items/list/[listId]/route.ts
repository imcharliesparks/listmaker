import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { listId: string } }) {
  return proxyToServer(req, `/api/items/list/${params.listId}`);
}
