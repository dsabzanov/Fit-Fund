import { WeightRecord } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ImageIcon, TrendingDown, TrendingUp } from "lucide-react";

interface WeightHistoryProps {
  challengeId: number;
  userId: number;
}

export function WeightHistory({ challengeId, userId }: WeightHistoryProps) {
  const { data: weightRecords = [] } = useQuery<WeightRecord[]>({
    queryKey: [`/api/challenges/${challengeId}/users/${userId}/weight-records`],
  });

  // Calculate progress statistics
  const sortedRecords = [...weightRecords].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const initialWeight = sortedRecords[0]?.weight;
  const currentWeight = sortedRecords[sortedRecords.length - 1]?.weight;
  const weightChange = initialWeight && currentWeight 
    ? Number(currentWeight) - Number(initialWeight)
    : 0;
  const weightChangePercentage = initialWeight
    ? (weightChange / Number(initialWeight)) * 100
    : 0;

  if (weightRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No weight records found. Start by logging your current weight!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Progress Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Starting Weight</p>
              <p className="font-semibold">{initialWeight} lbs</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
              <p className="font-semibold">{currentWeight} lbs</p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Total Change</p>
                <div className="flex items-center">
                  {weightChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : weightChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className={weightChange < 0 ? "text-green-500" : "text-red-500"}>
                    {weightChange.toFixed(1)} lbs ({weightChangePercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weight History List */}
        <div className="space-y-4">
          {sortedRecords.map((record) => (
            <div key={record.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{record.weight} lbs</span>
                  <time className="text-sm text-muted-foreground">
                    {format(new Date(record.recordedAt), "PPp")}
                  </time>
                </div>
                {record.imageUrl && (
                  <div className="mt-2">
                    <div className="relative h-24 w-32 overflow-hidden rounded-md">
                      <img
                        src={record.imageUrl}
                        alt="Weight verification"
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}