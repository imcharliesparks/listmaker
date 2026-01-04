import { Button } from "@repo/ui";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ListMaker</h1>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold tracking-tight">
            Curate Everything You Love Online
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Save links, organize them into beautiful lists, and share your favorites
            with friends or keep them private.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="text-lg px-8">
                  Start a List
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  View Your Lists
                </Button>
              </Link>
            </SignedIn>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Browse Lists
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">Save</div>
              <div className="text-sm text-muted-foreground">Links and inspiration</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">Organize</div>
              <div className="text-sm text-muted-foreground">Lists by theme</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">Share</div>
              <div className="text-sm text-muted-foreground">Public or private</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
