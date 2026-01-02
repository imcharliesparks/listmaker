"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui";
import { Button } from "@repo/ui";
import type { Match } from "@repo/database";

interface MatchCardProps {
  match: Match;
  onPlaceBet?: (matchId: string, outcome: "HOME" | "AWAY" | "DRAW") => void;
}

export function MatchCard({ match, onPlaceBet }: MatchCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "text-red-600 font-semibold";
      case "UPCOMING":
        return "text-green-600";
      case "FINISHED":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{match.name}</CardTitle>
          <span className={`text-sm ${getStatusColor(match.status)}`}>
            {match.status}
          </span>
        </div>
        {match.description && (
          <CardDescription>{match.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatDate(match.startTime)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="font-semibold">{match.homeTeam}</div>
              <div className="text-2xl font-bold text-primary">{match.homeOdds.toFixed(2)}</div>
            </div>

            {match.drawOdds && (
              <div className="text-center">
                <div className="font-semibold">Draw</div>
                <div className="text-2xl font-bold text-primary">{match.drawOdds.toFixed(2)}</div>
              </div>
            )}

            <div className="text-center">
              <div className="font-semibold">{match.awayTeam}</div>
              <div className="text-2xl font-bold text-primary">{match.awayOdds.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </CardContent>
      {onPlaceBet && match.status === "UPCOMING" && (
        <CardFooter className="gap-2 flex-col sm:flex-row">
          <Button
            onClick={() => onPlaceBet(match.id, "HOME")}
            variant="default"
            className="w-full sm:w-auto"
          >
            Bet {match.homeTeam}
          </Button>
          {match.drawOdds && (
            <Button
              onClick={() => onPlaceBet(match.id, "DRAW")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Bet Draw
            </Button>
          )}
          <Button
            onClick={() => onPlaceBet(match.id, "AWAY")}
            variant="default"
            className="w-full sm:w-auto"
          >
            Bet {match.awayTeam}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
