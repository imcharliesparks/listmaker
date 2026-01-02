"use client";

import { trpc } from "@/lib/trpc/client";
import { MatchCard } from "@/components/match-card";
import { LiveMatchCard } from "@/components/live-match-card";
import { Button } from "@repo/ui";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function DashboardPage() {
  const [betAmount, setBetAmount] = useState(100);

  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const { data: matches, isLoading } = trpc.matches.getAvailable.useQuery({ limit: 20 });

  const placeBetMutation = trpc.bets.place.useMutation({
    onSuccess: () => {
      alert("Bet placed successfully!");
    },
    onError: (error) => {
      alert(`Failed to place bet: ${error.message}`);
    },
  });

  const handlePlaceBet = (matchId: string, outcome: "HOME" | "AWAY" | "DRAW") => {
    const amount = prompt(`Enter bet amount (Balance: ${balance?.balance ?? 0} chips):`, betAmount.toString());
    if (amount) {
      const parsedAmount = parseInt(amount, 10);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setBetAmount(parsedAmount);
        placeBetMutation.mutate({ matchId, amount: parsedAmount, outcome });
      }
    }
  };

  const liveMatches = matches?.filter((m) => m.status === "LIVE") ?? [];
  const upcomingMatches = matches?.filter((m) => m.status === "UPCOMING") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Balance:</span>{" "}
                <span className="font-bold">{balance?.balance.toLocaleString() ?? "..."} chips</span>
              </div>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {liveMatches.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Live Matches</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveMatches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold mb-4">Upcoming Matches</h2>
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-muted-foreground">No upcoming matches available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back later for new betting opportunities
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onPlaceBet={handlePlaceBet}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
