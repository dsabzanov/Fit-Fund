import { useQuery } from "@tanstack/react-query";
import { Challenge } from "@shared/schema";
import { ChallengeCard } from "@/components/challenge-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Dumbbell, Trophy, Target } from "lucide-react";
import { CreateChallengeForm } from "@/components/create-challenge-form";
import { AccessibilitySettings } from "@/components/accessibility-settings";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading challenges">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-b from-primary/10 to-background"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm" role="banner">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    FitFund
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground" role="status" aria-label="User status">
                  Welcome, {user?.username}
                </span>
                <AccessibilitySettings />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Challenge</DialogTitle>
                    </DialogHeader>
                    <CreateChallengeForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-6 py-24 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Transform Your Health Journey
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
              Join our community-driven challenges where fitness meets financial motivation. Set goals, track progress, and earn rewards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center p-6 rounded-lg bg-white/95 border shadow-lg">
                <Dumbbell className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fitness Goals</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Set personalized weight loss targets and track your progress
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-lg bg-white/95 border shadow-lg">
                <Trophy className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Win Rewards</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Achieve your goals and earn financial incentives
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-lg bg-white/95 border shadow-lg">
                <Target className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Stay Motivated</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Join a supportive community committed to health
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <main className="container mx-auto px-4 py-12" role="main">
        <h2 className="text-3xl font-bold mb-8 text-center">Active Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Fitness challenges">
          {challenges?.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
            />
          ))}
        </div>
      </main>
    </div>
  );
}