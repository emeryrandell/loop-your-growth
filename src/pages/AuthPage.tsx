// src/pages/AuthPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);   // sign up / sign in
  const [error, setError] = useState<string | null>(null);

  // Reset flow state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false); // sending email

  // Set-new-password flow (after clicking email link)
  const [showSetNew, setShowSetNew] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [settingNew, setSettingNew] = useState(false);

  // Detect ?mode=reset to show "Set New Password" dialog
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (mode === "reset") {
      setShowSetNew(true);
      setResetOpen(false);
    }
  }, [location.search]);

  // If user logs in during reset flow, take them to dashboard
  useEffect(() => {
    if (user && showSetNew === false) {
      // nothing special; normal flow
    }
  }, [user, showSetNew]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    toast({
      title: "Account created!",
      description: "Check your email to confirm your account.",
    });
    navigate("/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    toast({
      title: "Welcome back!",
      description: "Signed in successfully.",
    });
    navigate("/dashboard");
  };

  // Send reset email via your Edge Function (custom HTML via Resend)
  const sendReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setError("Enter your email to receive a reset link.");
      return;
    }

    setResetting(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth?mode=reset`;

    const { data, error } = await supabase.functions.invoke("ai-trainer", {
      body: { action: "send_password_reset", email: targetEmail, redirectTo },
    });

    setResetting(false);

    if (error) {
      setError(error.message || "Could not send reset email. Try again.");
      return;
    }

    toast({
      title: "Check your inbox",
      description: `We sent a reset link to ${targetEmail}.`,
    });
    setResetOpen(false);
  };

  // Set new password after user returns from the email link
  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPass !== newPass2) {
      setError("Passwords do not match.");
      return;
    }

    setSettingNew(true);
    setError(null);

    const { data, error } = await supabase.auth.updateUser({ password: newPass });

    setSettingNew(false);

    if (error) {
      setError(error.message || "Could not update password.");
      return;
    }

    toast({
      title: "Password updated",
      description: "You can now sign in with your new password.",
    });

    setShowSetNew(false);
    // If a recovery session is active, navigate to dashboard; otherwise go to signin tab
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Welcome to Looped</h1>
          <p className="text-muted-foreground text-lg">Your journey to daily 1% improvements starts here</p>
        </div>

        <Card className="card-gradient">
          <Tabs defaultValue="signup" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>
            </CardHeader>

            {error && (
              <CardContent className="pb-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardContent>
            )}

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex-col space-y-4">
                  <Button type="submit" className="w-full btn-hero" disabled={loading}>
                    {loading ? "Creating Account..." : "Start Your Journey"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex-col space-y-4">
                  <Button type="submit" className="w-full btn-hero" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetOpen(true);
                      }}
                      className="text-primary hover:underline"
                      disabled={loading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            ← Back to Home
          </Button>
        </div>
      </div>

      {/* Send Reset Email Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>We’ll email you a secure link to set a new password.</DialogDescription>
          </DialogHeader>

          <form onSubmit={sendReset} className="space-y-3">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button type="submit" className="w-full btn-hero" disabled={resetting}>
              {resetting ? "Sending..." : "Send reset link"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set New Password Dialog (lands here from email link: /auth?mode=reset) */}
      <Dialog open={showSetNew} onOpenChange={setShowSetNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set a new password</DialogTitle>
            <DialogDescription>Enter your new password below.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitNewPassword} className="space-y-3">
            <Label htmlFor="new-pass">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-pass"
                type="password"
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="pl-10"
                minLength={6}
                required
              />
            </div>

            <Label htmlFor="new-pass2">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-pass2"
                type="password"
                placeholder="••••••••"
                value={newPass2}
                onChange={(e) => setNewPass2(e.target.value)}
                className="pl-10"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full btn-hero" disabled={settingNew}>
              {settingNew ? "Updating..." : "Update password"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
