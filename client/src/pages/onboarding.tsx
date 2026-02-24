import { useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clearGoogleOnboardingToken,
  getGoogleOnboardingToken,
  setToken,
} from "@/lib/utils";

function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, "_");
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const onboardingToken = getGoogleOnboardingToken();
    if (!onboardingToken) {
      navigate("/auth", { replace: true });
      return;
    }

    const nextUsername = normalizeUsername(username);
    if (!nextUsername) {
      setError("Username is required");
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/google/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: onboardingToken, username: nextUsername }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to complete onboarding");
      }
      if (!data.token) {
        throw new Error("Missing auth token");
      }

      setToken(data.token);
      clearGoogleOnboardingToken();
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pick your username</CardTitle>
          <CardDescription>Finish onboarding to continue into Echo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              type="text"
              value={username}
              disabled={isPending}
              onChange={(e) => {
                setError(null);
                setUsername(e.target.value);
              }}
              placeholder="Username"
              autoFocus
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
