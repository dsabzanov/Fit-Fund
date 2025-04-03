import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function CreateGamePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [percentageGoal, setPercentageGoal] = useState("4");  // String for input
  const [durationWeeks, setDurationWeeks] = useState("4");    // String for input
  const [entryFee, setEntryFee] = useState("40");             // String for input
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simple validation
      if (!title || title.length < 3) {
        toast({ title: "Error", description: "Title must be at least 3 characters", variant: "destructive" });
        setLoading(false);
        return;
      }
      
      if (!description || description.length < 10) {
        toast({ title: "Error", description: "Description must be at least 10 characters", variant: "destructive" });
        setLoading(false);
        return;
      }
      
      // Make sure we have the userId which is required by the API
      if (!user?.id) {
        toast({ title: "Error", description: "You must be logged in to create a challenge", variant: "destructive" });
        setLoading(false);
        return;
      }
      
      const startDate = new Date();
      const endDate = addDays(startDate, parseInt(durationWeeks || "4") * 7);
      
      const challengeData = {
        title,
        description,
        percentageGoal, // Already a string
        entryFee: parseInt(entryFee || "40"),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "open",
        userId: user.id
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
      setLoading(false);
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
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <div>
                      <label htmlFor="title" className="text-sm font-medium">Game Title</label>
                      <input 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="title" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a catchy title for your game"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <div>
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="description" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your challenge and set the rules"
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="percentageGoal" className="text-sm font-medium">Weight Loss Goal (%)</label>
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="percentageGoal" 
                      type="number" 
                      value={percentageGoal}
                      onChange={(e) => {
                        console.log("Percentage changed:", e.target.value);
                        setPercentageGoal(e.target.value);
                      }}
                      placeholder="e.g. 4" 
                      min="1"
                      max="30"
                      step="0.1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: 4% of starting weight
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="durationWeeks" className="text-sm font-medium">Duration (weeks)</label>
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="durationWeeks" 
                      type="number" 
                      value={durationWeeks}
                      onChange={(e) => {
                        console.log("Duration changed:", e.target.value);
                        setDurationWeeks(e.target.value);
                      }}
                      placeholder="e.g. 4" 
                      min="1"
                      max="12"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: 4 to 8 weeks
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="entryFee" className="text-sm font-medium">Bet Amount ($)</label>
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="entryFee" 
                      type="number" 
                      value={entryFee}
                      onChange={(e) => {
                        console.log("Entry fee changed:", e.target.value);
                        setEntryFee(e.target.value);
                      }}
                      placeholder="e.g. 40" 
                      min="1"
                      max="1000"
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
                  disabled={loading}
                >
                  {loading ? (
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