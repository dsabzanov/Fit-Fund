import { useState, useEffect } from "react";
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
import { FitbitConnect } from "@/components/fitbit-connect";
import { OnboardingTour } from "@/components/OnboardingTour";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (user) {
      setShowWelcome(true);
    }
  }, [user]);

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading challenges">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {showWelcome && <OnboardingTour />}

      <div className="min-h-screen bg-background">
        <div 
          className="relative bg-gradient-to-b from-primary/10 to-background"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=1920')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm" role="banner">
              <div className="container mx-auto px-4 sm:px-6 py-3">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/assets/IM_Logo_Full-Color (2).png"
                      alt="FitFund Logo"
                      className="h-8 sm:h-10 w-auto"
                    />
                    <h1 className="text-xl sm:text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        FitFund
                      </span>
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                    <span className="text-sm sm:text-base text-muted-foreground" role="status" aria-label="User status">
                      Welcome, {user?.username}
                    </span>
                    <div data-tour="fitbit-connect" className="hidden sm:block">
                      <FitbitConnect />
                    </div>
                    <AccessibilitySettings />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-tour="create-challenge" className="whitespace-nowrap">
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
              </div>
            </header>

            <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
                Transform Your Health Journey
              </h2>
              <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-12">
                Join our community-driven challenges where fitness meets financial motivation. Set goals, track progress, and earn rewards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto">
                <div className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/30 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">Want to lose 10%?</h3>
                  <p className="text-white/90 text-base mb-4">
                    Join our Weekly Transformer DietBet
                  </p>
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white mb-4 w-full sm:w-auto"
                  >
                    Play now
                  </Button>
                  <p className="text-sm text-white/80 font-medium">
                    Starts in 5 days
                  </p>
                </div>
                <div className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">WANT TO LOSE 4%?</h3>
                  <p className="text-white/90 text-base mb-2">
                    Join our Weekly Kickstarter
                  </p>
                  <p className="text-white/80 text-sm mb-4">
                    Or, create your own game!
                  </p>
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                  >
                    Play now
                  </Button>
                </div>
                <div className="flex flex-col items-center p-4 sm:p-6 rounded-lg bg-white/95 border shadow-lg">
                  <Target className="h-10 sm:h-12 w-10 sm:w-12 text-primary mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Stay Motivated</h3>
                  <p className="text-muted-foreground text-sm text-center">
                    Join a supportive community committed to health
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8 sm:py-12" role="main">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Active Challenges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" role="list" aria-label="Fitness challenges" data-tour="challenges">
            {challenges?.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}