import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full max-w-xl mx-auto px-4 py-8 flex items-center justify-between">
        <Link to="/auth">
          <div className="size-4 rounded-full bg-foreground/80" />
        </Link>
        <Link to="/auth">
          <Button variant="default" size="sm" className="text-sm font-normal">
            Login
          </Button>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 space-y-12">
        <section className="space-y-4">
          <h1 className="text-xl font-medium text-foreground">Echo</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A design document, made public.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Why this exists</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Most Q&A platforms optimize for volume. More questions, more answers, more engagement
            metrics. The result is noise. Threads become unreadable. Signal gets buried under
            accumulated cruft. We started Echo because we wanted something quieter.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted border border-dashed border-muted-foreground/20" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 bg-muted rounded" />
                <div className="h-2 w-48 bg-muted/50 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-muted/50 rounded" />
            <div className="h-3 w-3/4 bg-muted/50 rounded" />
            <div className="flex gap-4 pt-2">
              <div className="h-5 w-12 border border-dashed border-muted-foreground/30 rounded" />
              <div className="h-5 w-12 border border-dashed border-muted-foreground/30 rounded" />
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            A question should remain a question. An answer should remain an answer. The structure
            should not collapse under its own weight over time.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">The problem we react to</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Traditional forums treat every interaction as equally important. A tangential comment
            receives the same visual weight as the core answer. Threads sprawl. Context gets lost.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-2">
            <div className="text-xs text-muted-foreground/70 font-mono mb-3">request flow</div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">user</div>
              <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30" />
              <div className="h-6 w-16 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">server</div>
              <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30" />
              <div className="h-6 w-16 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">db</div>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="h-6 w-16 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">cache</div>
              <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30" />
              <div className="h-6 w-24 border border-dashed border-muted-foreground/30 rounded text-[10px] flex items-center justify-center text-muted-foreground/60">invalidated</div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            We chose constraints over features. Fewer levels of nesting. Clearer hierarchy.
            The goal is not to prevent discussion, but to keep it readable.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Chambers</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Communities are called Chambers. Each Chamber has its own context, its own culture,
            its own rhythm. Questions asked in one Chamber stay in that Chamber. There is
            no algorithmic feed mixing everything together.
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
            This separation is intentional. It prevents the platform from becoming a single
            homogeneous stream. Each Chamber can develop its own norms without interference.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Design philosophy</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We favor boring technology. The backend is Go. The frontend is React. The database
            is PostgreSQL. These choices are not exciting, but they are predictable. Predictable
            systems are easier to debug at 3am.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4">
            <div className="text-xs text-muted-foreground/70 font-mono mb-3">system overview</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">client</span>
                <div className="h-2 w-32 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">api</span>
                <div className="h-2 w-24 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">storage</span>
                <div className="h-2 w-40 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-between opacity-40">
                <span className="text-xs text-muted-foreground/70">search</span>
                <div className="h-2 w-20 bg-muted rounded" />
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            The interface is minimal because minimalism is a constraint that forces clarity.
            Every element must earn its place. If something can be removed without loss of
            function, it should be removed.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">Tradeoffs</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every design decision closes some doors. We chose depth over breadth. We chose
            focus over flexibility. We chose slower growth over viral mechanics.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-muted-foreground/70 text-right">latency</div>
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="w-12 text-xs text-muted-foreground/60 font-mono">~80ms</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-muted-foreground/70 text-right">complexity</div>
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="w-12 text-xs text-muted-foreground/60 font-mono">low</div>
            </div>
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-20 text-xs text-muted-foreground/70 text-right">features</div>
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full w-2/5 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="w-12 text-xs text-muted-foreground/60 font-mono">fewer</div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            These tradeoffs are not compromises. They are the architecture. A system optimized
            for everything is optimized for nothing.
          </p>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground">What comes next</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Echo is a work in progress. The roadmap is short because long roadmaps are usually
            fiction. We add what we need when we understand why we need it.
          </p>

          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4">
            <div className="text-xs text-muted-foreground/70 font-mono mb-3">timeline</div>
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
            If this approach resonates with you, you are welcome here.{" "}
            <Link
              to="/auth"
              className="text-foreground hover:underline underline-offset-2"
            >
              Sign up
            </Link>{" "}
            to get started.
          </p>
        </section>
      </main>

      <footer className="w-full max-w-xl mx-auto px-4 py-8 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>v0.1</span>
          <span>
            Built by{" "}
            <a
              href="https://github.com/electr1fy0"
              className="text-foreground font-medium hover:underline"
            >
              Ayush
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
