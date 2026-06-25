import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useVerifyMagicLink } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

export default function MagicLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { mutateAsync: verify } = useVerifyMagicLink();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const hasCalledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (token && !hasCalledRef.current) {
      hasCalledRef.current = true;
      setStatus("pending");
      verify(token)
        .then(() => {
          if (!mountedRef.current) return;
          setStatus("success");
        })
        .catch((err) => {
          if (!mountedRef.current) return;
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Verification failed");
        });
    } else if (!token) {
      setStatus("error");
      setErrorMessage("Missing magic link token");
    }
  }, [token, verify]);

  useEffect(() => {
    if (status !== "success") return;
    const id = setTimeout(() => {
      if (mountedRef.current) navigate("/", { replace: true });
    }, 1500);
    return () => clearTimeout(id);
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto size-12 rounded-full flex items-center justify-center mb-2 bg-neutral-100 dark:bg-neutral-800">
            {status === "pending" ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-6 animate-spin text-neutral-600"
              />
            ) : status === "success" ? (
              <div className="bg-green-100 dark:bg-green-900/30 w-full h-full rounded-full flex items-center justify-center">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="size-6 text-green-600 dark:text-green-500"
                />
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/30 w-full h-full rounded-full flex items-center justify-center">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="size-6 text-red-600 dark:text-red-500"
                />
              </div>
            )}
          </div>
          <CardTitle>
            {status === "pending"
              ? "Signing you in..."
              : status === "success"
                ? "Signed in!"
                : "Link expired or invalid"}
          </CardTitle>
          <CardDescription>
            {status === "pending"
              ? "Please wait while we verify your sign-in link."
              : status === "success"
                ? "You've been signed in successfully."
                : errorMessage || "This sign-in link is invalid or has expired. Please request a new one."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status !== "pending" && (
            <Link to="/" className="w-full">
              <Button className="w-full">Continue</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
