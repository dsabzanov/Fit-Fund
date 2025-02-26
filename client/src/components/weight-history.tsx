import { WeightRecord } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";

interface WeightHistoryProps {
  challengeId: number;
  userId: number;
}

export function WeightHistory({ challengeId, userId }: WeightHistoryProps) {
  const { data: weightRecords = [] } = useQuery<WeightRecord[]>({
    queryKey: [`/api/challenges/${challengeId}/users/${userId}/weight-records`],
  });

  if (weightRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No weight records found.</p>
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
        <div className="space-y-4">
          {weightRecords.map((record) => (
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
