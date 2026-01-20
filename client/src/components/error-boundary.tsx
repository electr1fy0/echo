import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-medium text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <div className="border border-dashed border-destructive/30 rounded-lg p-4 bg-destructive/5">
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-destructive/20 rounded mx-auto" />
                <div className="h-2 w-1/2 bg-destructive/20 rounded mx-auto" />
                <div className="h-2 w-2/3 bg-destructive/20 rounded mx-auto" />
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="min-w-[120px]"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
