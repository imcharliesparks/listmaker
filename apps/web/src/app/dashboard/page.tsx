"use client";

import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { DEFAULT_LISTS, type List } from "@/lib/lists";

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
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && lists.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No lists yet. They will appear here once created.
          </div>
        )}

        {!loading && lists.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <div key={list.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <h2 className="text-lg font-semibold">{list.title}</h2>
                {list.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
