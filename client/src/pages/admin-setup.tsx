import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminSetup() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    devCode: "fitfund-admin-2024" // Pre-filled dev code
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Missing required fields",
        description: "Username and password are required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setResult(null);
      
      const response = await fetch('/api/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: "Admin user created successfully!"
        });
        toast({
          title: "Success!",
          description: "Admin user has been created. You'll be redirected to login.",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create admin user."
        });
        toast({
          title: "Error",
          description: data.error || "Failed to create admin user.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An unexpected error occurred."
      });
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">FitFund Admin Setup</h1>
          <p className="text-muted-foreground mt-2">Create the first admin user for your application</p>
        </div>
        
        <Alert className="bg-amber-50 border-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Security Notice</AlertTitle>
          <AlertDescription className="text-amber-700">
            This page is intended for initial setup only. Delete or restrict access to it after creating your admin user.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
            <CardDescription>
              Enter details for the admin account. This user will have full access to the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                <Input 
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="admin"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                <Input 
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Secure password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="devCode">Development Code <span className="text-red-500">*</span></Label>
                <Input 
                  id="devCode"
                  name="devCode"
                  value={formData.devCode}
                  onChange={handleChange}
                  required
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  This code is required for admin creation. Do not change it.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Admin...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Create Admin User
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            {result && (
              <Alert 
                variant={result.success ? "default" : "destructive"}
                className={`w-full ${result.success ? "bg-green-50 border-green-200" : ""}`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.success ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription>
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a 
            href="/auth" 
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/auth");
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}