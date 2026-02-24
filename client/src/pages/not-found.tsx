import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-mono font-medium text-foreground">
            404
          </h1>
          <p className="text-sm text-muted-foreground">Page not found</p>
        </div>

        <div className="border border-dashed border-muted-foreground/30 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-4 justify-center opacity-50">
            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <span className="text-xs font-mono text-muted-foreground">?</span>
            </div>
            <div className="h-px w-12 bg-dashed border-t border-dashed border-muted-foreground/30" />
            <div className="w-16 h-16 rounded-lg border border-muted-foreground/30 bg-muted/10 flex items-center justify-center">
              <div className="w-8 h-1 bg-muted rounded-full" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-destructive/50 shrink-0" />
              <div className="h-2 w-full bg-muted/50 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="h-2 w-3/4 bg-muted/30 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="h-2 w-1/2 bg-muted/30 rounded" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground font-mono">
              error: destination_unreachable
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="default">
              Back
            </Button>
          </Link>
          <Link to="/home">
            <Button variant="outline" size="default">
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
