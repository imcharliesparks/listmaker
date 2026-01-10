"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { DEFAULT_LISTS, type List } from "@repo/shared/lists";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

async function syncUser(displayName?: string | null, photoUrl?: string | null) {
  await fetch("/api/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName, photoUrl }),
  });
}

async function fetchLists(): Promise<List[]> {
  const res = await fetch("/api/lists", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load lists");
  }
  const data = await res.json();
  return data.lists ?? [];
}

type ItemPreview = {
  id: number;
  url: string;
  title?: string | null;
  thumbnail_url?: string | null;
};

async function fetchListItemPreviews(listId: number): Promise<ItemPreview[]> {
  const res = await fetch(`/api/items/list/${listId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load list items");
  }
  const data = await res.json();
  return data.items ?? [];
}

async function createDefaultLists() {
  await Promise.all(
    DEFAULT_LISTS.map((list) =>
      fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: list.title,
          description: list.description,
        }),
      }),
    ),
  );
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [lists, setLists] = useState<List[]>([]);
  const [listPreviews, setListPreviews] = useState<Record<number, ItemPreview[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        await syncUser(user.fullName ?? user.username, user.imageUrl);

        let currentLists = await fetchLists();

        if (currentLists.length === 0) {
          await createDefaultLists();
          currentLists = await fetchLists();
        }

        if (!cancelled) {
          setLists(currentLists);
        }

        const previewEntries = await Promise.all(
          currentLists.map(async (list) => {
            try {
              const items = await fetchListItemPreviews(list.id);
              const previewItems = items
                .filter((item) => Boolean(item.thumbnail_url))
                .slice(0, 3);
              return [list.id, previewItems] as const;
            } catch {
              return [list.id, []] as const;
            }
          }),
        );

        if (!cancelled) {
          setListPreviews(Object.fromEntries(previewEntries));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Your Lists</h1>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-6">
        {loading && (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            Loading your lists...
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && lists.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No lists yet. They will appear here once created.
          </div>
        )}

        {!loading && lists.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/dashboard/lists/${list.id}`}
                className="block"
              >
                {(() => {
                  const previews = listPreviews[list.id] ?? [];
                  const slots: Array<ItemPreview | null> = [
                    previews[0] ?? null,
                    previews[1] ?? null,
                    previews[2] ?? null,
                  ];

                  return (
                <Card className="flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="bg-muted/40 aspect-[16/5] w-full overflow-hidden">
                    {previews.length > 0 ? (
                      <div className="grid h-full grid-cols-3 gap-px">
                        {slots.map((item, index) =>
                          item ? (
                            <div key={item.id} className="h-full overflow-hidden bg-muted">
                              <img
                                src={item.thumbnail_url!}
                                alt={item.title || "List preview"}
                                className="h-full w-full object-cover object-top"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div
                              key={`empty-${list.id}-${index}`}
                              className="h-full bg-muted"
                            />
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No previews yet
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold leading-tight">{list.title}</h2>
                    {list.description ? (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {list.description}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
                  );
                })()}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
