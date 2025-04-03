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
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (user) {
      setShowWelcome(true);
    }
  }, [user]);

  // Separate queries for open challenges and user challenges
  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges/open"],
    enabled: !user // Only fetch open challenges when not logged in
  });

  const { data: userChallenges = [], isLoading: isLoadingUserChallenges } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges/user", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/user/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch user challenges");
      return res.json();
    },
    enabled: !!user // Only fetch user challenges when logged in
  });

  // Combine challenges based on user status
  const displayChallenges = user ? userChallenges : challenges;
  const isLoadingAny = isLoading || isLoadingUserChallenges;

  if (isLoadingAny) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading challenges">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {showWelcome && user && <OnboardingTour />}

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
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">WANT TO LOSE 4%?</h3>
                  <p className="text-white/90 text-base mb-2">
                    Join our Weekly Transformer FitFund
                  </p>
                  <div className="flex-grow" />
                  <Link href="/weekly-game">
                    <Button 
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white mb-4 w-full sm:w-auto"
                    >
                      Play now
                    </Button>
                  </Link>
                  <p className="text-sm text-white/80 font-medium">
                    Starts in 5 days
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 backdrop-blur-sm border-2 border-primary/20 shadow-lg relative">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white flex items-center gap-2">
                    BACK-TO-BACK CHALLENGES
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="rounded-full p-1 bg-white/20 hover:bg-white/30 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                          <DialogTitle>About Back-to-Back Challenges</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>
                            <strong>What are Back-to-Back Challenges?</strong> These are continuous weight loss challenges that automatically start a new round when the previous one completes.
                          </p>
                          <p>
                            <strong>How does it work?</strong> 
                          </p>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Join a challenge series with friends or colleagues</li>
                            <li>When one challenge ends, a new one begins automatically</li>
                            <li>Maintain your momentum by continuing with the same group</li>
                            <li>Your entry fee from a winning round can be automatically applied to the next round</li>
                            <li>Track your progress across multiple challenges over time</li>
                          </ul>
                          <p>
                            <strong>Benefits:</strong> Consistent accountability, sustainable weight management, deeper community connections, and long-term habit formation.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </h3>
                  <p className="text-white/90 text-base mb-2">
                    Keep the momentum going! Join our continuous challenge series.
                  </p>
                  <p className="text-white/80 text-sm mb-4">
                    Automatically re-enter with your group
                  </p>
                  <div className="flex-grow" />
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                    onClick={() => {
                      toast({
                        title: "Coming Soon!",
                        description: "Back-to-back challenges will be available soon. Stay tuned!",
                      });
                    }}
                  >
                    Join Series
                  </Button>
                </div>

                <div className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-primary/30 to-primary/50 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">HOST A FITFUND</h3>
                  <p className="text-white/90 text-base mb-2">
                    Start a FitFund with your friends and family!
                  </p>
                  <div className="flex-grow" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg"
                        className="bg-white/10 hover:bg-white text-white hover:text-primary border-2 border-white/80 w-full sm:w-auto transition-colors"
                      >
                        Create FitFund
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New FitFund Challenge</DialogTitle>
                      </DialogHeader>
                      <CreateChallengeForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8 sm:py-12" role="main">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">
            {user ? "Your Challenges" : "Open Challenges"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" role="list" aria-label="Fitness challenges" data-tour="challenges">
            {displayChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
              />
            ))}
            {displayChallenges.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">
                <p>No challenges available at the moment.</p>
                {!user && (
                  <p className="mt-2">
                    <Link href="/auth">
                      <a className="text-primary hover:underline">Sign in</a>
                    </Link>
                    {" "}to see more challenges or create your own!</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}