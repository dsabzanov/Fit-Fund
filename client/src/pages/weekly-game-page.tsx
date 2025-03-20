import { WeeklyGameInstructions } from "@/components/weekly-game-instructions";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";

export default function WeeklyGamePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const mutation = useMutation({
    mutationFn: async () => {
      // First create the challenge
      const challengeRes = await apiRequest("POST", "/api/challenges", {
        title: `4% Weight Loss Challenge - Starting ${format(new Date(), 'MMM d')}`,
        description: "Join our community and transform your health journey in just 4 weeks. Lose 4% of your body weight and split the pot with other winners!",
        startDate: new Date(),
        endDate: addDays(new Date(), 28), // 4 weeks
        entryFee: 40,
        percentageGoal: 4,
        status: "open",
      });

      return challengeRes.json();
    },
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/user"] });

      // Navigate to the challenge page where they can join
      setLocation(`/challenge/${challenge.id}`);

      toast({
        title: "Challenge Created!",
        description: "You can now join the 4% weight loss challenge.",
      });
    },
    onError: (error: Error) => {
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
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Weekly Transformer FitFund</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community and transform your health journey in just 4 weeks
          </p>
          <Button 
            size="lg" 
            className="bg-primary text-white"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating Challenge..." : "Join Now - $40"}
          </Button>
        </div>

        <WeeklyGameInstructions />
      </main>
    </div>
  );
}