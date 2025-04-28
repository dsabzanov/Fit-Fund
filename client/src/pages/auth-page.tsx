import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AnimatedLogo } from "@/components/animated-logo"; //Import the AnimatedLogo component

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Handle error display for login and registration errors
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  
  // Clear login error when form values change
  React.useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [loginForm.watch("username"), loginForm.watch("password"), loginError]);
  
  // Clear registration error when form values change
  React.useEffect(() => {
    if (registerError) {
      setRegisterError(null);
    }
  }, [registerForm.watch("username"), registerForm.watch("password"), registerError]);
  
  // Handle redirect when user is logged in
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Render nothing when redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      toast({
        title: "Signing in...",
        description: "Please wait while we complete the authentication.",
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful:", result.user.email);
      
      // Get the ID token
      const idToken = await result.user.getIdToken();
      console.log("ID token obtained, sending to backend");
      
      // Send the token to our backend
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include" // Important for cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend auth failed:", response.status, errorText);
        throw new Error(`Failed to authenticate with backend: ${errorText}`);
      }

      console.log("Backend authentication successful");
      const user = await response.json();
      
      // Manually update auth context with the user data
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Success!",
        description: "You have successfully signed in with Google.",
      });
      
      // Navigate after successful login
      setLocation("/");
    } catch (error) {
      console.error("Google sign-in failed:", error);
      toast({
        title: "Sign-in Failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-8 relative"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7)), url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center max-w-6xl">
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-lg"></div>
            <div className="relative p-6">
              <h2 className="text-2xl font-bold mb-4">
                Meet Your Coach: <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Ilana Muhlstein, MS, RDN</span>
              </h2>
              
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <img 
                  src="/assets/ilana-headshot.jpg"
                  alt="Ilana Muhlstein headshot"
                  className="rounded-lg shadow-lg w-full md:w-1/2 max-w-xs object-cover"
                />
                
                <div className="space-y-4">
                  <p className="text-muted-foreground font-medium">
                    Ilana isn't just your coach—she's your biggest cheerleader.
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    As a Registered Dietitian Nutritionist, bestselling author, and creator of the 2B Mindset weight loss program, 
                    Ilana has helped hundreds of thousands of people transform their bodies, their health, and their relationship with food.
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    But here's the best part: she's been in your shoes. Ilana lost over 100 pounds herself—and kept it off—while
                    juggling real life as a mom of three and full-time professional. Her approach is practical, flexible, and empowering.
                  </p>
                  
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">With Ilana as your guide in FitFund, you'll get:</h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 rounded-full w-5 h-5 flex items-center justify-center text-primary text-xs">✓</span>
                        Proven tools and strategies that actually fit your life
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 rounded-full w-5 h-5 flex items-center justify-center text-primary text-xs">✓</span>
                        Encouragement without judgment
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 rounded-full w-5 h-5 flex items-center justify-center text-primary text-xs">✓</span>
                        A clear, motivating path toward your goals
                      </li>
                    </ul>
                  </div>
                  
                  <p className="text-sm font-medium">
                    She gets it. She lives it. And she's here to help you thrive. 💚
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-lg"></div>
            <div className="relative p-6 space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter">
                What is <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">FitFund</span>?
              </h1>
              <p className="text-muted-foreground">
                FitFund is your new favorite way to lose weight—with fun, structure, and real rewards.
              </p>
              
              <div className="space-y-5 mt-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">1</span>
                    Join a Challenge
                  </h3>
                  <p className="text-sm">Start by joining one of our 28-day weight loss challenges. You'll choose a personal goal—we recommend 4% of your starting weight—and commit to showing up for yourself every day.</p>
                </div>
                
                <div className="bg-white/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">2</span>
                    Place Your Bet
                  </h3>
                  <p className="text-sm">Put a small amount of money on the line. This isn't to scare you—it's to motivate you. When you meet your goal by the end of the challenge, you win your money back… and often more, split from the pot with other winners!</p>
                </div>
                
                <div className="bg-white/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">3</span>
                    Track Your Progress
                  </h3>
                  <p className="text-sm">Weigh in at the start and end of each challenge, and check in daily with updates, reflections, and wins—big or small. We make it simple and supportive.</p>
                </div>
                
                <div className="bg-white/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">4</span>
                    Get Support from Ilana + Community
                  </h3>
                  <p className="text-sm">Ilana Muhlstein, MS, RDN, is your expert guide throughout. You'll get motivating videos, tips, and tools from her, plus daily encouragement from a like-minded community that's in this with you.</p>
                </div>
                
                <div className="bg-white/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">5</span>
                    Celebrate Your Wins (with Cash!)
                  </h3>
                  <p className="text-sm">Hit your goal and get rewarded. The accountability, community, and expert coaching make all the difference.</p>
                </div>
                
                <div className="bg-primary/10 p-4 rounded-lg mt-2">
                  <h3 className="font-semibold text-lg mb-1.5">Why It Works:</h3>
                  <p className="text-sm">Because we're making weight loss fun again. This isn't about punishment—it's about positive motivation, progress over perfection, and the support you need to succeed.</p>
                  <p className="text-sm font-medium mt-3">You've got this. We believe in you. Now let's crush this—together. 💪</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/90">
          <CardHeader>
            <CardTitle>Welcome to FitFund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(
                    (data) => {
                      loginMutation.mutate(data, {
                        onError: (error) => {
                          setLoginError(error.message);
                        }
                      });
                    }
                  )} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {loginError && (
                      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded border border-destructive/20">
                        {loginError}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(
                    (data) => {
                      registerMutation.mutate(data, {
                        onError: (error) => {
                          setRegisterError(error.message);
                        }
                      });
                    }
                  )} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {registerError && (
                      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded border border-destructive/20">
                        {registerError}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Ilana Muhlstein Logo */}
      <div className="fixed bottom-8 left-8 p-2 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm border border-muted" style={{ minWidth: '100px', minHeight: '100px' }}>
        <AnimatedLogo />
      </div>
    </div>
  );
}