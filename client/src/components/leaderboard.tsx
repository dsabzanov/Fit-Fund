import { Participant, WeightRecord } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, TrendingDown, TrendingUp, Crown } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LeaderboardProps {
  participants: Participant[];
  weightRecords: WeightRecord[];
  isHost?: boolean;
}

export function Leaderboard({ participants, weightRecords, isHost }: LeaderboardProps) {
  // Calculate weight loss percentage for each participant
  const participantProgress = participants.map(participant => {
    const userRecords = weightRecords
      .filter(record => record.userId === participant.userId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    const latestWeight = userRecords[0]?.weight || participant.currentWeight;
    const percentageLost = ((Number(participant.startWeight) - Number(latestWeight)) / Number(participant.startWeight)) * 100;
    const lastWeekRecords = userRecords.slice(0, 7);
    const weeklyTrend = lastWeekRecords.length > 1 
      ? Number(lastWeekRecords[0].weight) - Number(lastWeekRecords[lastWeekRecords.length - 1].weight)
      : 0;

    return {
      ...participant,
      latestWeight,
      percentageLost: Math.round(percentageLost * 10) / 10,
      weeklyTrend,
      lastWeighIn: userRecords[0]?.recordedAt,
      totalWeighIns: userRecords.length
    };
  }).sort((a, b) => b.percentageLost - a.percentageLost);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Leaderboard</CardTitle>
        {isHost && (
          <Badge variant="outline" className="bg-primary/5">
            <Crown className="h-4 w-4 mr-1" />
            Host View
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {participantProgress.map((participant, index) => (
            <div key={participant.id} className="space-y-2">
              <div className="flex items-center gap-4">
                {index < 3 && (
                  <Trophy className={`h-5 w-5 ${
                    index === 0 ? "text-yellow-500" :
                    index === 1 ? "text-gray-400" :
                    "text-amber-600"
                  }`} />
                )}
                <Avatar>
                  <AvatarFallback>
                    {participant.userId.toString().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Participant #{participant.userId}</span>
                    <span className="text-sm font-medium">
                      {participant.percentageLost}% lost
                    </span>
                  </div>
                  <Progress value={Math.abs(participant.percentageLost)} max={4} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Current: {participant.latestWeight} lbs</span>
                    <div className="flex items-center gap-1">
                      {participant.weeklyTrend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : participant.weeklyTrend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span>
                        {Math.abs(participant.weeklyTrend).toFixed(1)} lbs this week
                      </span>
                    </div>
                  </div>
                  {isHost && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last weigh-in: {participant.lastWeighIn ? format(new Date(participant.lastWeighIn), 'MMM d, yyyy') : 'Never'} 
                      • Total weigh-ins: {participant.totalWeighIns}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}