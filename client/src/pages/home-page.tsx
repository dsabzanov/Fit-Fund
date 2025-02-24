import { useQuery } from "@tanstack/react-query";
import { Challenge } from "@shared/schema";
import { ChallengeCard } from "@/components/challenge-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createPaymentSession } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const handleJoinChallenge = async (challenge: Challenge) => {
    try {
      await createPaymentSession(challenge.id, challenge.entryFee);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">WeightBet</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges?.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onJoin={handleJoinChallenge}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
