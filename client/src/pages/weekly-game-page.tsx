import { WeeklyGameInstructions } from "@/components/weekly-game-instructions";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { Challenge } from "@shared/schema";

export default function WeeklyGamePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const mutation = useMutation({
    mutationFn: async () => {
      const challenge = {
        title: `4% Weight Loss Challenge - Starting ${format(new Date(), 'MMM d')}`,
        description: "Join our community and transform your health journey in just 4 weeks. Lose 4% of your body weight and split the pot with other winners!",
        startDate: new Date().toISOString(),
        endDate: addDays(new Date(), 28).toISOString(), // 4 weeks
        entryFee: 40,
        percentageGoal: 4,
        status: "open",
      };

      console.log('Creating challenge with data:', challenge);

      // Use apiRequest instead of fetch directly to ensure proper credentials handling
      const res = await apiRequest("POST", "/api/challenges", challenge);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }

      const createdChallenge = await res.json();
      console.log('Created new challenge:', createdChallenge);

      if (!createdChallenge.id) {
        throw new Error('Created challenge is missing ID');
      }

      return createdChallenge as Challenge;
    },
    onSuccess: (challenge) => {
      console.log('Challenge creation successful, redirecting to:', `/challenge/${challenge.id}`);

      // Invalidate the queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/user"] });
      // Also invalidate the specific challenge endpoint to ensure it's available
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challenge.id}`] });

      toast({
        title: "Challenge Created!",
        description: "You can now join the 4% weight loss challenge.",
      });

      // Increase the delay to ensure state updates are complete
      setTimeout(() => {
        // Use window.location.href instead of setLocation for a hard refresh
        window.location.href = `/challenge/${challenge.id}`;
      }, 500);
    },
    onError: (error: Error) => {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Weekly Transformer FitFund</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community and transform your health journey in just 4 weeks
          </p>
        </div>

        <WeeklyGameInstructions />

        <div className="max-w-4xl mx-auto text-center mt-12">
          <Button 
            size="lg" 
            className="bg-primary text-white"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Challenge...
              </>
            ) : (
              "Start Your Challenge Now - $40"
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Click to create your challenge and begin your transformation journey!
          </p>
        </div>
      </main>
    </div>
  );
}