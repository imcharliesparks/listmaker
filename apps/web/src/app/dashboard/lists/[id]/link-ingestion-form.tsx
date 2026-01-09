"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";

type IngestionCreateResponse = {
  jobId: number;
  status: string;
};

type IngestionStatusResponse = {
  jobId: number;
  status: string;
  itemId?: number | null;
  error?: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  const url = new URL(trimmed);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are supported");
  }
  return url.toString();
}

export function LinkIngestionForm({ listId }: { listId: string }) {
  const router = useRouter();
  const listIdNumber = useMemo(() => Number(listId), [listId]);

  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!Number.isFinite(listIdNumber)) {
      setError("Invalid list id");
      return;
    }

    let normalized: string;
    try {
      normalized = normalizeUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid URL");
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      const createRes = await fetch("/api/ingestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: listIdNumber, url: normalized }),
      });

      const createJson = (await createRes.json().catch(() => null)) as IngestionCreateResponse | null;
      if (!createRes.ok || !createJson?.jobId) {
        const message =
          (createJson as unknown as { error?: string })?.error ||
          `Failed to start ingestion (${createRes.status})`;
        throw new Error(message);
      }

      setStatus(createJson.status ?? "queued");

      const startedAt = Date.now();
      const timeoutMs = 60_000;

      while (Date.now() - startedAt < timeoutMs) {
        await sleep(1250);

        const jobRes = await fetch(`/api/ingestions/${createJson.jobId}`, { cache: "no-store" });
        const jobJson = (await jobRes.json().catch(() => null)) as IngestionStatusResponse | null;

        if (!jobRes.ok || !jobJson?.status) {
          continue;
        }

        setStatus(jobJson.status);

        if (jobJson.status === "completed") {
          setUrl("");
          router.refresh();
          return;
        }

        if (jobJson.status === "failed") {
          throw new Error(jobJson.error || "Ingestion failed");
        }
      }

      throw new Error("Timed out waiting for ingestion to finish");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add link");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add a link</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a URL (Pinterest, YouTube, etc.)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add"}
          </Button>
        </form>

        {status ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">{status}</span>
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

