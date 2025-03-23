import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Challenge } from "@shared/schema";
import { WeightForm } from "@/components/weight-form";
import { Leaderboard } from "@/components/leaderboard";
import { Chat } from "@/components/chat";
import { Feed } from "@/components/feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, Target, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Crown, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WeightHistory } from "@/components/weight-history";
import { ShareButton } from "@/components/share-button";

export default function ChallengePage() {
  const { user } = useAuth();
  const [match, params] = useRoute<{ id: string }>("/challenge/:id");
  const challengeId = match && params ? parseInt(params.id) : NaN;

  const { data: challenge, isLoading: isLoadingChallenge, error } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${challengeId}`],
    enabled: !isNaN(challengeId),
  });

  const { data: participants = [] } = useQuery({
    queryKey: [`/api/challenges/${challengeId}/participants`],
    enabled: !isNaN(challengeId),
  });

  const { data: weightRecords = [] } = useQuery({
    queryKey: [`/api/challenges/${challengeId}/weight-records`],
    enabled: !isNaN(challengeId),
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: [`/api/challenges/${challengeId}/chat`],
    enabled: !isNaN(challengeId),
  });

  if (isNaN(challengeId) || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Invalid Challenge ID</h1>
          <p className="text-muted-foreground mt-2">Please check the URL and try again.</p>
          <Link href="/">
            <Button variant="link" className="mt-4">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingChallenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Challenge Not Found</h1>
          <p className="text-muted-foreground mt-2">The challenge you're looking for doesn't exist.</p>
          <Link href="/">
            <Button variant="link" className="mt-4">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(challenge.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const progress = Math.min(
    100,
    ((new Date().getTime() - new Date(challenge.startDate).getTime()) /
      (new Date(challenge.endDate).getTime() -
        new Date(challenge.startDate).getTime())) *
      100
  );

  const isHost = challenge.userId === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {isHost && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Host Dashboard</h2>
              <Badge variant="outline" className="bg-primary/5">Host View</Badge>
            </div>
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                As the host, you have access to additional controls and can manage this challenge.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{challenge.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <ShareButton 
                      challenge={challenge}
                      customMessage={`I'm participating in "${challenge.title}" on FitFund! Join me in this ${challenge.percentageGoal}% weight loss challenge. 💪`}
                    />
                    {isHost && (
                      <Badge variant="secondary">
                        <Crown className="h-4 w-4 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {challenge.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>{daysRemaining} days left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" aria-hidden="true" />
                    <span>${challenge.entryFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" aria-hidden="true" />
                    <span>{challenge.percentageGoal}% goal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span>{participants.length} participants</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Challenge Progress: {Math.round(progress)}%
                </p>

                {isHost && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Host Controls</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Send Reminder to All
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        View Detailed Stats
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Feed challengeId={challengeId} />

            <Chat challengeId={challengeId} initialMessages={chatMessages} />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Track Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Quick Weight Update</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Track your progress by submitting your current weight. Don't forget to include a verification photo!
                    </p>
                    <WeightForm challengeId={challengeId} />
                  </div>

                  <Alert className="bg-muted/50">
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Photo Verification Guidelines:</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          <li>Take a clear photo of your scale display</li>
                          <li>Include today's date written on paper next to the scale</li>
                          <li>Ensure the weight reading is clearly visible</li>
                          <li>Maximum file size: 5MB</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Your Progress History</h3>
                    <WeightHistory challengeId={challengeId} userId={user?.id || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Leaderboard
              participants={participants}
              weightRecords={weightRecords}
              isHost={isHost}
            />
          </div>
        </div>
      </div>
    </div>
  );
}