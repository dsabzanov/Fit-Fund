import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea"; 
import { addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

// Create schema for the game form
const createGameSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  percentageGoal: z.coerce.number().min(1, "Goal must be at least 1%").max(30, "Goal cannot exceed 30%"),
  durationWeeks: z.coerce.number().min(1, "Duration must be at least 1 week").max(12, "Duration cannot exceed 12 weeks"),
  entryFee: z.coerce.number().min(1, "Entry fee must be at least $1").max(1000, "Entry fee cannot exceed $1000"),
});

type CreateGameFormValues = z.infer<typeof createGameSchema>;

export default function CreateGamePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Use local state for the form values to simplify handling
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    percentageGoal: 4,
    durationWeeks: 4,
    entryFee: 40
  });
  
  // Handle direct form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      // For number inputs, convert to number or use empty string
      setFormValues((prev: typeof formValues) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      // For text inputs
      setFormValues((prev: typeof formValues) => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Create the form controller with our values
  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    values: formValues, // Use our state values instead of defaultValues
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: CreateGameFormValues) => {
      const startDate = new Date();
      const endDate = addDays(startDate, data.durationWeeks * 7); // Convert weeks to days
      
      // Make sure we have the userId which is required by the API
      if (!user?.id) {
        throw new Error("You must be logged in to create a challenge");
      }
      
      const challengeData = {
        title: data.title,
        description: data.description,
        percentageGoal: data.percentageGoal.toString(), // Convert to string as expected by API
        entryFee: data.entryFee,
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

  const onSubmit = (data: CreateGameFormValues) => {
    createGameMutation.mutate(data);
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Game Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter a catchy title for your game" 
                                name="title"
                                value={formValues.title}
                                onChange={handleInputChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                name="description"
                                placeholder="Describe your challenge and set the rules" 
                                className="h-24"
                                value={formValues.description}
                                onChange={handleInputChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="percentageGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Loss Goal (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              name="percentageGoal"
                              placeholder="e.g. 4" 
                              value={formValues.percentageGoal}
                              onChange={handleInputChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Recommended: 4% of starting weight
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="durationWeeks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (weeks)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              name="durationWeeks"
                              placeholder="e.g. 4" 
                              value={formValues.durationWeeks}
                              onChange={handleInputChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Recommended: 4 to 8 weeks
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="entryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bet Amount ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              name="entryFee"
                              placeholder="e.g. 40" 
                              value={formValues.entryFee}
                              onChange={handleInputChange}
                            />
                          </FormControl>
                          <FormDescription>
                            How much each participant will bet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
