import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, FormEvent } from "react";

export default function CreateGamePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use refs for direct form access
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const percentageGoalRef = useRef<HTMLInputElement>(null);
  const durationWeeksRef = useRef<HTMLInputElement>(null);
  const entryFeeRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate and gather all form values
      const title = titleRef.current?.value;
      const description = descriptionRef.current?.value;
      const percentageGoal = percentageGoalRef.current?.value;
      const durationWeeks = durationWeeksRef.current?.value;
      const entryFee = entryFeeRef.current?.value;
      
      // Simple validation
      if (!title || title.length < 3) {
        toast({ title: "Error", description: "Title must be at least 3 characters", variant: "destructive" });
        return;
      }
      
      if (!description || description.length < 10) {
        toast({ title: "Error", description: "Description must be at least 10 characters", variant: "destructive" });
        return;
      }
      
      // Make sure we have the userId which is required by the API
      if (!user?.id) {
        toast({ title: "Error", description: "You must be logged in to create a challenge", variant: "destructive" });
        return;
      }
      
      // Parse numeric values
      const percentGoalNum = parseFloat(percentageGoal || "4");
      const durationNum = parseInt(durationWeeks || "4", 10);
      const entryFeeNum = parseInt(entryFee || "40", 10);
      
      const startDate = new Date();
      const endDate = addDays(startDate, durationNum * 7); // Convert weeks to days
      
      const challengeData = {
        title,
        description,
        percentageGoal: percentGoalNum.toString(), // Convert to string as expected by API
        entryFee: entryFeeNum,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "open",
        userId: user.id // Add userId from the authenticated user
      };
      
      console.log("Creating challenge with data:", challengeData);
      const response = await apiRequest("POST", "/api/challenges", challengeData);
      const challenge = await response.json();
      
      toast({
        title: "Success!",
        description: "Your FitFund has been created successfully.",
      });
      
      navigate(`/challenge/${challenge.id}`);
    } catch (error) {
      console.error("Failed to create FitFund:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create FitFund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">You need to log in to create a FitFund.</p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Create Your Own FitFund</h1>
            <p className="text-xl text-muted-foreground">
              Host a custom weight loss challenge for your community
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form 
                ref={formRef}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <div>
                      <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Game Title
                      </label>
                      <input 
                        ref={titleRef}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="title" 
                        name="title"
                        placeholder="Enter a catchy title for your game"
                        defaultValue=""
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <div>
                      <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Description
                      </label>
                      <textarea 
                        ref={descriptionRef}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="description" 
                        name="description"
                        placeholder="Describe your challenge and set the rules"
                        defaultValue=""
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="percentageGoal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Weight Loss Goal (%)
                    </label>
                    <input 
                      ref={percentageGoalRef}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="percentageGoal" 
                      name="percentageGoal"
                      type="number" 
                      placeholder="e.g. 4" 
                      defaultValue="4"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: 4% of starting weight
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="durationWeeks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Duration (weeks)
                    </label>
                    <input 
                      ref={durationWeeksRef}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="durationWeeks" 
                      name="durationWeeks"
                      type="number" 
                      placeholder="e.g. 4" 
                      defaultValue="4"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: 4 to 8 weeks
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="entryFee" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Bet Amount ($)
                    </label>
                    <input 
                      ref={entryFeeRef}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="entryFee" 
                      name="entryFee"
                      type="number" 
                      placeholder="e.g. 40" 
                      defaultValue="40"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      How much each participant will bet
                    </p>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-primary text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create FitFund"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
