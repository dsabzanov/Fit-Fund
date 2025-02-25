import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Challenge, Participant, WeightRecord, ChatMessage } from "@shared/schema";
import { WeightForm } from "@/components/weight-form";
import { Leaderboard } from "@/components/leaderboard";
import { Chat } from "@/components/chat";
import { Feed } from "@/components/feed"; // Added import for Feed component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Calendar, DollarSign, Target, Users } from "lucide-react";

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const challengeId = parseInt(id);

  const { data: challenge, isLoading: isLoadingChallenge } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${challengeId}`],
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: [`/api/challenges/${challengeId}/participants`],
  });

  const { data: weightRecords = [] } = useQuery<WeightRecord[]>({
    queryKey: [`/api/challenges/${challengeId}/weight-records`],
  });

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/challenges/${challengeId}/chat`],
  });

  if (isLoadingChallenge || !challenge) {
    return <div>Loading...</div>;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{challenge.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {challenge.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{daysRemaining} days left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>${challenge.entryFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>{challenge.percentageGoal}% goal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{participants.length} participants</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Challenge Progress: {Math.round(progress)}%
                </p>
              </CardContent>
            </Card>

            <Feed challengeId={challengeId} />

            <Card>
              <CardHeader>
                <CardTitle>Submit Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <WeightForm challengeId={challengeId} />
              </CardContent>
            </Card>

            <Chat challengeId={challengeId} initialMessages={chatMessages} />
          </div>

          <div className="space-y-8">
            <Leaderboard
              participants={participants}
              weightRecords={weightRecords}
            />
          </div>
        </div>
      </div>
    </div>
  );
}