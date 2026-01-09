import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyToServer(req, `/api/items/${params.id}`);
}
