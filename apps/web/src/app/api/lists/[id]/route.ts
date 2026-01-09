import { proxyToServer } from "@/lib/server-api";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyToServer(req, `/api/lists/${params.id}`);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyToServer(req, `/api/lists/${params.id}`);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyToServer(req, `/api/lists/${params.id}`);
}
