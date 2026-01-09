import { cookies, headers } from "next/headers";
import Link from "next/link";
import type { List } from "@repo/shared/lists";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { LinkIngestionForm } from "./link-ingestion-form";
import { ImageLightbox } from "@/components/image-lightbox";

type Item = {
  id: number;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
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

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="bg-muted">
                  {item.thumbnail_url ? (
                    <ImageLightbox
                      images={[
                        {
                          src: item.thumbnail_url,
                          alt: item.title || "Saved link preview",
                        },
                      ]}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full" />
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">
                      <Link href={`/dashboard/items/${item.id}`} className="hover:underline underline-offset-4">
                        {item.title || item.url}
                      </Link>
                    </CardTitle>
                    {item.source_type ? (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                        {item.source_type}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {item.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.description}
                    </p>
                  ) : null}

                  {item.video_url ? (
                    <a
                      href={item.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline underline-offset-4"
                    >
                      View video
                    </a>
                  ) : null}

                  <p className="text-xs text-muted-foreground break-all">
                    {item.url}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
