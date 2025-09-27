import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

/** Inline reset password view shown when URL has ?mode=reset */
const ResetPasswordView = () => {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Password updated. Please sign in again.");
    await supabase.auth.signOut();
    // Optional: redirect to sign-in
    // window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-gradient">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full btn-hero" disabled={loading}>
              {loading ? "Saving..." : "Set new password"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = "/auth")}>
              Back to sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // If the email link brought the user to /auth?mode=reset, show inline reset view
  const params = new URLSearchParams(location.search);
  const isResetMode = params.get("mode") === "reset";
  if (isResetMode) return <ResetPasswordView />;

  const sendReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setError("Enter your email to receive a reset link.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trainer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_password_reset",
            email: targetEmail,
            redirectTo: `${window.location.origin}/auth?mode=reset`,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send reset email.");
      }

      toast({
        title: "Check your inbox",
        description: `We sent a reset link to ${targetEmail}.`,
      });
      setResetOpen(false);
    } catch (err: any) {
      setError(err.message || "Couldn't send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Account created successfully!",
        description: "Please check your email to confirm your account.",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account.",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Welcome to Looped
          </h1>
          <p className="text-muted-foreground text-lg">
            Your journey to daily 1% improvements starts here
          </p>
          <p className="text-sm text-primary mt-2 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            Mobile app with free features coming soon!
          </p>
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
                      onClick={() => setResetOpen(true)}
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

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>We'll email you a secure link to set a new password.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
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
              />
            </div>
            <Button onClick={sendReset} className="w-full btn-hero" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
