"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import type { Match } from "@repo/database";

interface LiveMatchCardProps {
  match: Match;
}

export function LiveMatchCard({ match }: LiveMatchCardProps) {
  return (
    <Card className="w-full border-red-500/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <CardTitle className="text-lg">LIVE: {match.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Home</div>
            <div className="text-xl font-bold">{match.homeTeam}</div>
            <div className="text-lg text-primary">{match.homeOdds.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Away</div>
            <div className="text-xl font-bold">{match.awayTeam}</div>
            <div className="text-lg text-primary">{match.awayOdds.toFixed(2)}</div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Betting currently unavailable for live matches
        </div>
      </CardContent>
    </Card>
  );
}
