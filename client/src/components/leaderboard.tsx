import { Participant, WeightRecord } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface LeaderboardProps {
  participants: Participant[];
  weightRecords: WeightRecord[];
}

export function Leaderboard({ participants, weightRecords }: LeaderboardProps) {
  // Calculate weight loss percentage for each participant
  const participantProgress = participants.map(participant => {
    const latestWeight = weightRecords
      .filter(record => record.userId === participant.userId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]?.weight || participant.currentWeight;
    
    const percentageLost = ((participant.startWeight - latestWeight) / participant.startWeight) * 100;
    
    return {
      ...participant,
      percentageLost: Math.round(percentageLost * 10) / 10,
    };
  }).sort((a, b) => b.percentageLost - a.percentageLost);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {participantProgress.map((participant, index) => (
            <div key={participant.id} className="flex items-center gap-4">
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
              <div className="flex-grow">
                <div className="font-medium">Participant #{participant.userId}</div>
                <div className="text-sm text-muted-foreground">
                  {participant.percentageLost}% lost
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{participant.currentWeight} lbs</div>
                <div className="text-sm text-muted-foreground">
                  Started: {participant.startWeight} lbs
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
