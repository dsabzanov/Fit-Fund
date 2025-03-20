import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Challenge, Participant, WeightRecord, ChatMessage } from "@shared/schema";
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
import { WeightHistory } from "@/components/weight-history"; // Import WeightHistory component


export default function ChallengePage() {
  const { user } = useAuth();
  const [match, params] = useRoute<{ id: string }>("/challenge/:id");
  const challengeId = match && params ? parseInt(params.id) : NaN;

  const { data: challenge, isLoading: isLoadingChallenge, error } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${challengeId}`, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Must be logged in to view challenge");
      const res = await fetch(`/api/challenges/${challengeId}/user/${user.id}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You don't have access to this challenge");
        }
        throw new Error("Failed to load challenge");
      }
      return res.json();
    },
    enabled: !isNaN(challengeId) && !!user?.id,
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: [`/api/challenges/${challengeId}/participants`],
    enabled: !isNaN(challengeId),
  });

  const { data: weightRecords = [] } = useQuery<WeightRecord[]>({
    queryKey: [`/api/challenges/${challengeId}/weight-records`],
    enabled: !isNaN(challengeId),
  });

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
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
            <a className="text-primary hover:underline mt-4 block">Return to Home</a>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingChallenge) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading challenge details">
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
            <a className="text-primary hover:underline mt-4 block">Return to Home</a>
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

  const isHost = user?.isHost;

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
                  {isHost && (
                    <Badge variant="secondary">
                      <Crown className="h-4 w-4 mr-1" />
                      Host
                    </Badge>
                  )}
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
                <WeightForm challengeId={challengeId} />
                <Separator className="my-6" />
                <WeightHistory challengeId={challengeId} userId={user?.id || 0} />
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