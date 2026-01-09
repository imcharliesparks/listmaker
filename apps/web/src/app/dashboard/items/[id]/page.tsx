import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui";
import { ImageLightbox } from "@/components/image-lightbox";

type Item = {
  id: number;
  list_id: number;
  url: string;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  source_type?: string | null;
  position?: number | null;
  metadata?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return res.json();
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { item } = await fetchJson<{ item: Item }>(`${baseUrl}/api/items/${id}`, init);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Item</p>
            <h1 className="text-2xl font-bold">{item.title || "Saved link"}</h1>
            <p className="text-sm text-muted-foreground">In list #{item.list_id}</p>
          </div>
          <Link href={`/dashboard/lists/${item.list_id}`} className="text-sm text-primary underline underline-offset-4">
            Back to list
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          <div className="bg-muted">
            {item.thumbnail_url ? (
              <ImageLightbox
                images={[
                  {
                    src: item.thumbnail_url,
                    alt: item.title || "Saved link preview",
                  },
                ]}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div className="aspect-[16/9] w-full" />
            )}
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg leading-snug">{item.title || item.url}</CardTitle>
              {item.source_type ? (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                  {item.source_type}
                </span>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {item.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            ) : null}

            <div className="grid gap-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Item ID</span>
                <span className="font-mono">{item.id}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">List ID</span>
                <span className="font-mono">{item.list_id}</span>
              </div>
              {item.video_url ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Video</span>
                  <span className="font-mono break-all">{item.video_url}</span>
                </div>
              ) : null}
              {typeof item.position === "number" ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Position</span>
                  <span className="font-mono">{item.position}</span>
                </div>
              ) : null}
              {item.created_at ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-mono">{item.created_at}</span>
                </div>
              ) : null}
              {item.updated_at ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-mono">{item.updated_at}</span>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Raw metadata</h2>
              <pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                {formatJson(item.metadata)}
              </pre>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-3">
            <Link href={`/dashboard/lists/${item.list_id}`} className="text-sm text-muted-foreground underline underline-offset-4">
              Back
            </Link>
            <a href={item.url} target="_blank" rel="noreferrer">
              <Button variant="outline">Source</Button>
            </a>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
