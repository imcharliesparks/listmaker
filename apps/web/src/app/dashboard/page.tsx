"use client";

import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
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

      <main className="container mx-auto px-4 py-12">
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Listmaker dashboard setup is in progress. Your lists will appear here soon.
        </div>
      </main>
    </div>
  );
}
