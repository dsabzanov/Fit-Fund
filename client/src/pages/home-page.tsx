import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Challenge } from "@shared/schema";
import { ChallengeCard } from "@/components/challenge-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Dumbbell, Trophy, Target, Crown, HelpCircle } from "lucide-react";
import { CreateChallengeForm } from "@/components/create-challenge-form";
import { AccessibilitySettings } from "@/components/accessibility-settings";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HomeButton } from "@/components/home-button";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(true);
  
  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logoutMutation.mutate();
      window.location.href = "/auth";
    }
  };

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

      <div className="min-h-screen bg-background relative">
        <HomeButton />
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                    <AccessibilitySettings />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          data-tour="create-challenge" 
                          className="whitespace-nowrap"
                          onClick={() => console.log("Nav create challenge button clicked")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Challenge
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create New Challenge</DialogTitle>
                        </DialogHeader>
                        <CreateChallengeForm onSuccess={() => {
                          console.log("Challenge created from navbar, redirecting...");
                        }} />
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
                  <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-full">Coming Soon</span>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white flex items-center gap-2">
                    BACK-TO-BACK CHALLENGES
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="rounded-full p-1 bg-white/20 hover:bg-white/30 transition-colors">
                          <HelpCircle className="h-4 w-4 text-white" />
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
                    Our back-to-back challenge series keeps the momentum going 
                  </p>
                  <div className="bg-white/10 rounded-lg p-3 my-2 w-full">
                    <ul className="text-white/90 text-sm space-y-1.5">
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Automatic re-entry with your group</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Continuous accountability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Long-term sustainable results</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-white/80 italic mt-2">
                    Watch for this feature coming soon!
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-primary/30 to-primary/50 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white flex items-center gap-2">
                    HOST A FITFUND
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="rounded-full p-1 bg-white/20 hover:bg-white/30 transition-colors">
                          <HelpCircle className="h-4 w-4 text-white" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                          <DialogTitle>About Hosting a FitFund Challenge</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>
                            <strong>What is a FitFund Challenge?</strong> A FitFund is a weight loss challenge where participants contribute to a prize pool and compete to meet their weight loss goals.
                          </p>
                          <p>
                            <strong>How does it work?</strong> 
                          </p>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Create a challenge with customized duration (4-12 weeks recommended)</li>
                            <li>Set an entry fee that participants pay to join</li>
                            <li>Define a reasonable weight loss percentage goal (4-8% of starting weight)</li>
                            <li>Invite friends, family, or colleagues to participate</li>
                            <li>Track progress through regular weigh-ins</li>
                            <li>Winners who achieve the goal share the prize pool equally</li>
                          </ul>
                          <p>
                            <strong>Host Responsibilities:</strong>
                          </p>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Set fair rules and goals for all participants</li>
                            <li>Verify weigh-in submissions for accuracy</li>
                            <li>Provide motivation and support to participants</li>
                            <li>Manage prize distribution at the end of the challenge</li>
                          </ul>
                          <p>
                            <strong>Terms & Conditions:</strong> By hosting a challenge, you agree to fairly administer the challenge according to the rules. FitFund takes a small platform fee from the prize pool to maintain the service.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </h3>
                  <p className="text-white/90 text-base mb-2">
                    Start a FitFund with your friends and family!
                  </p>
                  <div className="bg-white/10 rounded-lg p-3 my-2 w-full">
                    <ul className="text-white/90 text-sm space-y-1.5">
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Set your own entry fee and goals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Invite friends and family to join</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Winners share the prize pool</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex-grow" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg"
                        className="bg-white/10 hover:bg-white text-white hover:text-primary border-2 border-white/80 w-full sm:w-auto transition-colors"
                        onClick={() => console.log("Create FitFund button clicked")}
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        Create FitFund
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New FitFund Challenge</DialogTitle>
                      </DialogHeader>
                      <CreateChallengeForm onSuccess={() => {
                        console.log("Challenge created successfully, redirecting...");
                      }} />
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