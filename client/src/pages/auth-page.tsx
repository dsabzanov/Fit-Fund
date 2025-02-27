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

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

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

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({
        title: "Signing in...",
        description: "Please wait while we complete the authentication.",
      });

      const idToken = await result.user.getIdToken();
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend");
      }

      const user = await response.json();
      loginMutation.mutate(user);

      toast({
        title: "Success!",
        description: "You have successfully signed in with Google.",
      });
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
            <div className="relative grid grid-cols-2 gap-4 p-6">
              <img 
                src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500"
                alt="Healthy breakfast"
                className="rounded-lg shadow-lg transform hover:scale-105 transition-transform"
              />
              <img 
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500"
                alt="Fresh vegetables"
                className="rounded-lg shadow-lg transform hover:scale-105 transition-transform"
              />
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-lg"></div>
            <div className="relative p-6 space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter">
                Transform Your Life with
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> FitFund</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Join weight loss challenges, bet on yourself, and win money while achieving your wellness goals.
                Our platform makes healthy living enjoyable, social, and rewarding.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                  <p className="font-semibold">Mindful Eating</p>
                </div>
                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                  <p className="font-semibold">Healthy Choices</p>
                </div>
                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                  <p className="font-semibold">Better Life</p>
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
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
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
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
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
      <div className="fixed bottom-8 left-8">
        <img
          src="/IM_Initials_Green.png"
          alt="Ilana Muhlstein Logo"
          className="h-16 w-auto"
          onError={(e) => {
            // Fallback to black logo if green fails
            console.error('Failed to load green logo');
            e.currentTarget.src = "/IM_Initials_Black.png";
          }}
        />
      </div>
    </div>
  );
}