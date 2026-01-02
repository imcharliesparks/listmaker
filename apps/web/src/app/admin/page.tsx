import { prisma } from "@repo/database";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";

export default async function AdminPage() {
  const session = await auth();

  if (!session.userId) {
    redirect("/");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get stats
  const [totalMatches, totalBets, totalUsers, pendingBets] = await Promise.all([
    prisma.match.count(),
    prisma.bet.count(),
    prisma.user.count(),
    prisma.bet.count({ where: { status: "PENDING" } }),
  ]);

  const matches = await prisma.match.findMany({
    orderBy: { startTime: "desc" },
    take: 10,
    include: {
      _count: {
        select: { bets: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Total Matches</CardDescription>
                <CardTitle className="text-3xl">{totalMatches}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total Bets</CardDescription>
                <CardTitle className="text-3xl">{totalBets}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Pending Bets</CardDescription>
                <CardTitle className="text-3xl">{pendingBets}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-3xl">{totalUsers}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Matches */}
          <section>
            <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
            <div className="space-y-4">
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{match.name}</CardTitle>
                      <span className="text-sm px-2 py-1 rounded bg-muted">
                        {match.status}
                      </span>
                    </div>
                    <CardDescription>
                      {match.homeTeam} vs {match.awayTeam}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Bets:</span>{" "}
                        <span className="font-semibold">{match._count.bets}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start:</span>{" "}
                        <span className="font-semibold">
                          {new Date(match.startTime).toLocaleString()}
                        </span>
                      </div>
                      {match.result && (
                        <div>
                          <span className="text-muted-foreground">Result:</span>{" "}
                          <span className="font-semibold">{match.result}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="text-center text-sm text-muted-foreground">
            <p>Note: Use tRPC mutations from the client to create/update/settle matches</p>
          </div>
        </div>
      </main>
    </div>
  );
}
