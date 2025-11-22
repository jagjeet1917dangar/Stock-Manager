import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Mail, Lock, User, ArrowRight, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // --- Reset Password State ---
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");

  // --- Login Handler ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Welcome back!");
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Signup Handler ---
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created! Please log in.");
        setActiveTab("login");
      } else {
        toast.error(data.message || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error("Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Reset Password Handlers ---

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setResetEmail(email);
        setResetStep(2);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP (Local check before sending to server with password)
  const handleVerifyOtpStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const otp = formData.get("otp") as string;
    
    if(otp.length < 6) {
        toast.error("Please enter a valid 6-digit OTP");
        return;
    }
    
    setResetOtp(otp);
    setResetStep(3);
  };

  // Step 3: Final Reset
  const handleFinalReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword");

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            email: resetEmail, 
            otp: resetOtp, 
            newPassword 
        }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successfully! Please login.");
        setResetStep(1);
        setResetEmail("");
        setResetOtp("");
        setActiveTab("login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-primary shadow-strong">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">StockMaster</h1>
          </div>
          <h2 className="text-3xl font-semibold text-foreground leading-tight">
            Modern Inventory Management for Growing Businesses
          </h2>
          <p className="text-lg text-muted-foreground">
            Track stock levels, manage warehouses, and streamline operations with our professional-grade inventory system.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {["Real-time inventory tracking", "Multi-warehouse support", "Automated stock alerts", "Comprehensive reporting"].map((feature, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <Card className="shadow-strong border-border animate-scale-in">
          <CardHeader className="space-y-1">
            <div className="flex lg:hidden items-center justify-center space-x-2 mb-4">
              <Package className="w-6 h-6 text-primary" />
              <span className="text-2xl font-bold">StockMaster</span>
            </div>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="login-email" name="email" type="email" placeholder="you@company.com" className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" name="password" type="password" placeholder="••••••••" className="pl-9" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-name" name="name" type="text" placeholder="John Doe" className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" name="email" type="email" placeholder="you@company.com" className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-password" name="password" type="password" placeholder="••••••••" className="pl-9" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reset">
                {/* STEP 1: EMAIL INPUT */}
                {resetStep === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Enter your registered email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="reset-email" name="email" type="email" placeholder="you@company.com" className="pl-9" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}

                {/* STEP 2: OTP INPUT */}
                {resetStep === 2 && (
                  <form onSubmit={handleVerifyOtpStep} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-otp">Enter OTP sent to {resetEmail}</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="reset-otp" name="otp" type="text" placeholder="123456" className="pl-9 tracking-widest" maxLength={6} required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Verify OTP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="w-full" type="button" onClick={() => setResetStep(1)}>
                      Back to Email
                    </Button>
                  </form>
                )}

                {/* STEP 3: NEW PASSWORD INPUT */}
                {resetStep === 3 && (
                  <form onSubmit={handleFinalReset} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Enter New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="new-password" name="newPassword" type="password" placeholder="••••••••" className="pl-9" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Resetting..." : "Reset Password"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;