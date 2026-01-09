import { cookies, headers } from "next/headers";
import Link from "next/link";
import type { List } from "@repo/shared/lists";
import { LinkIngestionForm } from "./link-ingestion-form";

type Item = {
  id: number;
  title?: string | null;
  description?: string | null;
  url: string;
  source_type?: string | null;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return res.json();
}

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listId } = await params;

  const cookieHeader = cookies().toString();
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "http://localhost:3000");

  const init: RequestInit = {
    headers: {
      cookie: cookieHeader,
    },
  };

  const [listRes, itemsRes] = await Promise.all([
    fetchJson<{ list: List }>(`${baseUrl}/api/lists/${listId}`, init),
    fetchJson<{ items: Item[] }>(`${baseUrl}/api/items/list/${listId}`, init),
  ]);

  const { list } = listRes;
  const { items } = itemsRes;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">List</p>
            <h1 className="text-2xl font-bold">{list.title}</h1>
            {list.description ? (
              <p className="text-sm text-muted-foreground">{list.description}</p>
            ) : null}
          </div>
          <Link href="/dashboard" className="text-sm text-primary underline underline-offset-4">
            Back to lists
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-4">
        <LinkIngestionForm listId={listId} />

        {items.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            No items yet. Add one from the app.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{item.title || item.url}</h2>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground break-all">{item.url}</p>
                  </div>
                  {item.source_type ? (
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                      {item.source_type}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
