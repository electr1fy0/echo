import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { handleApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { useResetPassword } from "@/hooks/use-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export default function ResetPassword() {
 const [searchParams] = useSearchParams();
 const token = searchParams.get("token");
 const navigate = useNavigate();
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [success, setSuccess] = useState(false);

 const { mutate: resetPassword, isPending, error } = useResetPassword();

 useEffect(() => {
 if (!token) {
 navigate("/");
 }
 }, [token, navigate]);

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (newPassword !== confirmPassword) {
 alert("Passwords do not match");
 return;
 }
 if (!token) return;

 resetPassword(
 { token, newPassword },
 {
 onSuccess: () => setSuccess(true),
  onError: (err) => handleApiError(err, "Failed to reset password"),
 },
 );
 }

 if (success) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-background p-4">
 <Card className="w-full max-w-md text-center">
 <CardHeader>
 <div className="mx-auto size-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
 <HugeiconsIcon
 icon={CheckmarkCircle02Icon}
 className="size-6 text-green-600 dark:text-green-400"
 />
 </div>
 <CardTitle>Password Reset Complete</CardTitle>
 <CardDescription>
 Your password has been successfully updated. You can now sign in
 with your new password.
 </CardDescription>
 </CardHeader>
 <CardContent>
 <Button className="w-full" onClick={() => navigate("/")}>
 Go to Sign In
 </Button>
 </CardContent>
 </Card>
 </div>
 );
 }

 return (
 <div className="min-h-screen flex items-center justify-center bg-background p-4">
 <Card className="w-full max-w-md ">
 <CardHeader className="text-center pb-2">
 <div className="my-2">
 <div className="mx-auto size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
 <img
 src="/turnsoutlogo.svg"
 alt="TurnsOut"
 className="size-7 invert dark:invert-0 opacity-80"
 />
 </div>
 </div>
 <CardTitle className="text-lg text-left">Set New Password</CardTitle>
 <CardDescription className="text-left">
 Please enter your new password below.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <form className="space-y-3" onSubmit={handleSubmit}>
 {error && (
 <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
 <HugeiconsIcon icon={Alert02Icon} size={20} />
 <span>{error.message}</span>
 </div>
 )}
            <Input
              type="password"
              placeholder="New Password"
              aria-label="New Password"
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              aria-label="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
 <Button
 className="w-full"
 type="submit"
 disabled={
 isPending || !newPassword.trim() || !confirmPassword.trim()
 }
 >
 {isPending ? "Resetting..." : "Reset Password"}
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 );
}
