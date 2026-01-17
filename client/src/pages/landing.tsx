import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-12">
        <section className="space-y-3 mb-12">
          <h1 className="text-lg  text-foreground">Echo</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            An open QnA platform for your curious mind. No clutter, no
            distractions. Only your questions waiting patiently.
          </p>
        </section>

        <section className="space-y-3 mb-12">
          <h2 className="text-base text-foreground">About</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            In a world of overwhelming platforms, Echo is your quiet corner. No
            algorithms deciding what matters. Ask questions, share answers, and
            move on.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base  text-foreground">Join</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Create an account to start asking questions.{" "}
            <Link
              to="/auth"
              className="text-foreground  hover:underline underline-offset-2"
            >
              Sign up here
            </Link>{" "}
            to get started.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-xl mx-auto px-4 py-8 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>v0.1</span>
          <span>
            Built by{" "}
            <span className="text-foreground font-medium hover:underline ">
              <a href="https://github.com/electr1fy0">Ayush</a>
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
