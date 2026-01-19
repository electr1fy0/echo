import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full max-w-xl mx-auto px-4 py-8 flex items-center justify-between">
        <Link to="/auth">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <img src="/echologo.svg" alt="Echo" className="size-7" />
          </div>
        </Link>
        <Link to="/auth">
          <Button
            variant="outline"
            size="default"
            className="rounded-lg text-sm font-normal"
          >
            Create Account
          </Button>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 space-y-12">
        <section className="space-y-4">
          <h1 className="text-xl font-medium text-foreground">Echo</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            An open QnA platform for the rest of us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">
            Why this exists
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Most platforms optimize for volume. More posts, more questions, more
            answers, more engagement metrics. The result is noise. Threads
            become unreadable. Signal gets buried.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            I built Echo because I wanted something quieter.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-muted border border-dashed border-muted-foreground/20 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-16 bg-muted rounded" />
                  <div className="h-2 w-10 bg-muted/40 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-muted/50 rounded" />
                  <div className="h-3 w-4/5 bg-muted/50 rounded" />
                </div>
              </div>
              <div className="h-7 w-14 border border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center shrink-0">
                <div className="h-2 w-6 bg-muted/50 rounded" />
              </div>
            </div>

            <div className="border-t border-dashed border-muted-foreground/20 pt-3 ml-10 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-muted border border-dashed border-muted-foreground/20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1.5 w-12 bg-muted rounded" />
                    <div className="h-1.5 w-8 bg-muted/40 rounded" />
                  </div>
                  <div className="h-2.5 w-3/4 bg-muted/50 rounded" />
                </div>
              </div>
              <div className="flex items-start gap-2 opacity-60">
                <div className="w-5 h-5 rounded-full bg-muted border border-dashed border-muted-foreground/20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1.5 w-14 bg-muted rounded" />
                    <div className="h-1.5 w-6 bg-muted/40 rounded" />
                  </div>
                  <div className="h-2.5 w-2/3 bg-muted/50 rounded" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A question should remain a question. An answer should remain an
            answer. The structure should not collapse under its own weight over
            time.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">The problem</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Traditional forums treat every interaction as equally important. A
            tangential comment receives the same visual weight as the core
            answer. Threads sprawl. Context gets lost.
          </p>

          <p className="text-muted-foreground text-sm leading-relaxed">
            I chose constraints over features. Fewer levels of nesting. Clearer
            hierarchy. The goal is not to prevent discussion, but to keep it
            readable.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Chambers</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Communities are called Chambers. Each Chamber has its own context,
            its own culture, its own rhythm. Questions asked in one Chamber stay
            in that Chamber. There is no algorithmic feed mixing everything
            together.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-400/40 border border-dashed border-amber-500/30" />
                <div className="h-2 w-12 bg-muted rounded" />
              </div>
              <div className="h-2 w-full bg-muted/50 rounded" />
              <div className="h-2 w-2/3 bg-muted/50 rounded" />
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-400/40 border border-dashed border-blue-500/30" />
                <div className="h-2 w-16 bg-muted rounded" />
              </div>
              <div className="h-2 w-full bg-muted/50 rounded" />
              <div className="h-2 w-1/2 bg-muted/50 rounded" />
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-400/40 border border-dashed border-emerald-500/30" />
                <div className="h-2 w-10 bg-muted rounded" />
              </div>
              <div className="h-2 w-full bg-muted/50 rounded" />
              <div className="h-2 w-3/4 bg-muted/50 rounded" />
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            This separation is intentional. It prevents the platform from
            becoming a single homogeneous stream. Each Chamber can develop its
            own norms without interference.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">
            Architecture
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The backend is Go. The frontend is React + Tanstack Query. The
            database is PostgreSQL. Auth JWTs. Interactions are optimistic. The
            UI is snappy. And so and so. These are not clever choices. They are
            boring choices that work.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-4">
            <div className="text-xs text-muted-foreground/70 font-mono">
              request flow
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-14 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">
                client
              </div>
              <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30" />
              <div className="h-6 w-10 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">
                jwt
              </div>
              <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30" />
              <div className="h-6 w-14 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">
                handler
              </div>
              <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30" />
              <div className="h-6 w-14 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">
                postgres
              </div>
            </div>
          </div>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4">
            <div className="text-xs text-muted-foreground/70 font-mono mb-5">
              stack
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">
                  react + typescript
                </span>
                <div className="h-2 w-32 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">
                  tanstack query
                </span>
                <div className="h-2 w-20 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">
                  go net/http
                </span>
                <div className="h-2 w-28 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">
                  postgresql
                </span>
                <div className="h-2 w-40 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between opacity-40">
                <span className="text-xs text-muted-foreground/70">jwt</span>
                <div className="h-2 w-20 bg-muted rounded" />
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            The interface is minimal because minimalism is a constraint that
            forces clarity. Every element must earn its place. If something can
            be removed without loss of function, it should be removed.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Tradeoffs</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every design decision closes some doors. I chose depth over breadth.
            I chose focus over flexibility. I chose slower growth over viral
            mechanics.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-muted-foreground/70 text-right">
                questions
              </div>
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="w-20 text-xs text-muted-foreground/60 font-mono">
                votable
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-muted-foreground/70 text-right">
                replies
              </div>
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full w-2/5 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="w-20 text-xs text-muted-foreground/60 font-mono">
                one-level
              </div>
            </div>
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-20 text-xs text-muted-foreground/70 text-right">
                threads
              </div>
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="w-20 text-xs text-muted-foreground/60 font-mono">
                none
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            These tradeoffs are not compromises. They are the architecture. A
            system optimized for everything is optimized for nothing.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Privacy</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your data is yours. Zero trackers. Zero ads. And if you ever want to
            leave, you can delete your account and all your data instantly.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">
            What comes next
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Echo is a work in progress. The roadmap is short because long
            roadmaps are usually fiction. I add what I need when I understand
            why I need it.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4">
            <div className="text-xs text-muted-foreground/70 font-mono mb-3">
              timeline
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <div className="h-2.5 w-20 bg-muted rounded" />
                  <div className="h-2 w-32 bg-muted/50 rounded" />
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <div className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/40 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <div className="h-2.5 w-24 bg-muted rounded" />
                  <div className="h-2 w-40 bg-muted/50 rounded" />
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-30">
                <div className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/40 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <div className="h-2.5 w-16 bg-muted rounded" />
                  <div className="h-2 w-28 bg-muted/50 rounded" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            If this approach resonates with you, you are welcome here.
          </p>
        </section>

        <section className="pt-4">
          <Link to="/auth">
            <Button
              variant="default"
              size="lg"
              className="w-full text-sm font-normal "
            >
              Create an account
            </Button>
          </Link>
        </section>
      </main>

      <footer className="w-full max-w-xl mx-auto px-4 py-8 mt-4 border-t border-border">
        <div className="flex flex-col gap-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>v0.5.5</span>
            <div className="flex items-center gap-4">
              <a
                href="mailto:me@ayushpandey.xyz?subject=Hi%20Ayush"
                className="hover:text-foreground transition-colors"
              >
                Support
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>© 2026 Echo</span>
            <span>
              Built by{" "}
              <a
                href="https://github.com/electr1fy0"
                className="text-foreground font-medium hover:underline"
                target="_blank"
              >
                Ayush
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
