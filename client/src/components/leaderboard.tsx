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
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Leaderboard
          </CardTitle>
          {isHost && (
            <Badge variant="outline" className="bg-primary/5">
              <Crown className="h-4 w-4 mr-1" />
              Host View
            </Badge>
          )}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Participants ranked by percentage of weight lost
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {participantProgress.length === 0 ? (
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">No participants have joined this challenge yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Winners Podium (if there are at least 3 participants) */}
            {participantProgress.length >= 3 && (
              <div className="flex justify-center items-end gap-1 mb-8 mt-2 px-2">
                {/* Second place */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-14 w-14 border-2 border-gray-300">
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      {participantProgress[1].userId.toString().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-200 h-16 w-20 flex items-center justify-center rounded-t-lg mt-2">
                    <div className="text-center">
                      <Badge className="bg-gray-400 hover:bg-gray-400">2nd</Badge>
                      <p className="text-xs font-medium mt-1">{participantProgress[1].percentageLost}%</p>
                    </div>
                  </div>
                </div>

                {/* First place */}
                <div className="flex flex-col items-center -mt-4">
                  <div className="relative">
                    <Crown className="h-6 w-6 text-yellow-500 absolute -top-7 left-1/2 transform -translate-x-1/2" />
                    <Avatar className="h-16 w-16 border-2 border-yellow-400">
                      <AvatarFallback className="bg-yellow-50 text-yellow-700">
                        {participantProgress[0].userId.toString().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="bg-yellow-100 h-24 w-24 flex items-center justify-center rounded-t-lg mt-2">
                    <div className="text-center">
                      <Badge className="bg-yellow-500 hover:bg-yellow-500">1st</Badge>
                      <p className="text-sm font-bold mt-1">{participantProgress[0].percentageLost}%</p>
                      <p className="text-xs mt-1">Leader</p>
                    </div>
                  </div>
                </div>

                {/* Third place */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-14 w-14 border-2 border-amber-600">
                    <AvatarFallback className="bg-amber-50 text-amber-700">
                      {participantProgress[2].userId.toString().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-amber-50 h-12 w-20 flex items-center justify-center rounded-t-lg mt-2">
                    <div className="text-center">
                      <Badge className="bg-amber-600 hover:bg-amber-600">3rd</Badge>
                      <p className="text-xs font-medium mt-1">{participantProgress[2].percentageLost}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="space-y-1 mt-6">
              <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-3 pb-2">
                <div className="col-span-1">Rank</div>
                <div className="col-span-7">Participant</div>
                <div className="col-span-2 text-right">Loss %</div>
                <div className="col-span-2 text-right">Current</div>
              </div>
              
              {participantProgress.map((participant, index) => (
                <div 
                  key={participant.id} 
                  className={`p-3 rounded-lg grid grid-cols-12 items-center gap-2
                    ${index === 0 ? "bg-yellow-50 border border-yellow-100" : 
                      index === 1 ? "bg-gray-50 border border-gray-100" : 
                      index === 2 ? "bg-amber-50 border border-amber-100" : 
                      "bg-muted"}`}
                >
                  {/* Rank */}
                  <div className="col-span-1 font-bold text-lg text-center">
                    {index + 1}
                  </div>

                  {/* User info */}
                  <div className="col-span-7 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {participant.userId.toString().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">Participant #{participant.userId}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {participant.weeklyTrend < 0 ? (
                          <span className="flex items-center text-green-600">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Lost {Math.abs(participant.weeklyTrend).toFixed(1)} lbs this week
                          </span>
                        ) : participant.weeklyTrend > 0 ? (
                          <span className="flex items-center text-red-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Gained {participant.weeklyTrend.toFixed(1)} lbs this week
                          </span>
                        ) : (
                          <span>No change this week</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weight loss percentage */}
                  <div className="col-span-2 text-right">
                    <span className={`font-semibold text-sm
                      ${participant.percentageLost > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                      {participant.percentageLost > 0 ? "-" : ""}{participant.percentageLost}%
                    </span>
                  </div>

                  {/* Current weight */}
                  <div className="col-span-2 text-right text-sm">
                    {participant.latestWeight} lbs
                  </div>

                  {/* Progress bar */}
                  <div className="col-span-12 mt-2">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          index === 0 ? "bg-yellow-500" :
                          index === 1 ? "bg-gray-400" :
                          index === 2 ? "bg-amber-600" :
                          "bg-primary/60"
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(participant.percentageLost) * 25)}%` }}
                      />
                    </div>
                  </div>

                  {/* Host-only data */}
                  {isHost && (
                    <div className="col-span-12 text-xs text-muted-foreground mt-2 flex justify-between">
                      <span>Last weigh-in: {participant.lastWeighIn ? format(new Date(participant.lastWeighIn), 'MMM d, yyyy') : 'Never'}</span>
                      <span>Total weigh-ins: {participant.totalWeighIns}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}