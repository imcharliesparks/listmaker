import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToServer(req, `/api/items/${id}`);
}
