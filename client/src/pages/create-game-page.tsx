import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
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
  
  // Use local state for form values
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [percentageGoal, setPercentageGoal] = useState(4);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [entryFee, setEntryFee] = useState(40);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const createGameMutation = useMutation({
    mutationFn: async () => {
      // Validate form inputs
      const newErrors: {[key: string]: string} = {};
      
      if (!title) newErrors.title = "Title is required";
      else if (title.length < 3) newErrors.title = "Title must be at least 3 characters";
      
      if (!description) newErrors.description = "Description is required";
      else if (description.length < 10) newErrors.description = "Description must be at least 10 characters";
      
      if (!percentageGoal) newErrors.percentageGoal = "Weight loss goal is required";
      else if (percentageGoal < 1) newErrors.percentageGoal = "Goal must be at least 1%";
      else if (percentageGoal > 30) newErrors.percentageGoal = "Goal cannot exceed 30%";
      
      if (!durationWeeks) newErrors.durationWeeks = "Duration is required";
      else if (durationWeeks < 1) newErrors.durationWeeks = "Duration must be at least 1 week";
      else if (durationWeeks > 12) newErrors.durationWeeks = "Duration cannot exceed 12 weeks";
      
      if (!entryFee) newErrors.entryFee = "Bet amount is required";
      else if (entryFee < 1) newErrors.entryFee = "Entry fee must be at least $1";
      else if (entryFee > 1000) newErrors.entryFee = "Entry fee cannot exceed $1000";
      
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        throw new Error("Please fix form errors");
      }
      
      const startDate = new Date();
      const endDate = addDays(startDate, durationWeeks * 7); // Convert weeks to days
      
      // Make sure we have the userId which is required by the API
      if (!user?.id) {
        throw new Error("You must be logged in to create a challenge");
      }
      
      const challengeData = {
        title,
        description,
        percentageGoal: percentageGoal.toString(), // Convert to string as expected by API
        entryFee,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "open",
        userId: user.id // Add userId from the authenticated user
      };
      
      console.log("Creating challenge with data:", challengeData);
      const response = await apiRequest("POST", "/api/challenges", challengeData);
      return await response.json();
    },
    onSuccess: (challenge) => {
      toast({
        title: "Success!",
        description: "Your FitFund has been created successfully.",
      });
      navigate(`/challenge/${challenge.id}`);
    },
    onError: (error) => {
      console.error("Failed to create FitFund:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create FitFund. Please try again.",
        variant: "destructive",
      });
    }
  });

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
                onSubmit={(e) => {
                  e.preventDefault();
                  createGameMutation.mutate();
                }} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <div>
                      <Label htmlFor="title">Game Title</Label>
                      <Input 
                        id="title"
                        placeholder="Enter a catchy title for your game" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description"
                        placeholder="Describe your challenge and set the rules" 
                        className="h-24"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="percentageGoal">Weight Loss Goal (%)</Label>
                    <Input 
                      id="percentageGoal"
                      type="number" 
                      placeholder="e.g. 4" 
                      value={percentageGoal}
                      onChange={(e) => setPercentageGoal(Number(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: 4% of starting weight
                    </p>
                    {errors.percentageGoal && (
                      <p className="text-sm text-red-500 mt-1">{errors.percentageGoal}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="durationWeeks">Duration (weeks)</Label>
                    <Input 
                      id="durationWeeks"
                      type="number" 
                      placeholder="e.g. 4" 
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: 4 to 8 weeks
                    </p>
                    {errors.durationWeeks && (
                      <p className="text-sm text-red-500 mt-1">{errors.durationWeeks}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="entryFee">Bet Amount ($)</Label>
                    <Input 
                      id="entryFee"
                      type="number" 
                      placeholder="e.g. 40" 
                      value={entryFee}
                      onChange={(e) => setEntryFee(Number(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      How much each participant will bet
                    </p>
                    {errors.entryFee && (
                      <p className="text-sm text-red-500 mt-1">{errors.entryFee}</p>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-primary text-white"
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? (
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
