import { WeightRecord } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
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
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-center">
        <h3 className="font-medium text-blue-800 mb-2">No Weight Records Yet</h3>
        <p className="text-blue-600 text-sm mb-3">Begin tracking your progress by submitting your first weight entry.</p>
        <div className="flex justify-center">
          <div className="bg-white rounded-lg p-3 inline-flex items-center shadow-sm">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">STEP 1</span>
              <span className="text-sm font-medium">Enter Weight</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-2 text-gray-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">STEP 2</span>
              <span className="text-sm font-medium">Add Photo</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-2 text-gray-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">STEP 3</span>
              <span className="text-sm font-medium">Submit</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Summary */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
        <h3 className="font-semibold mb-3 flex items-center text-green-800">
          <TrendingDown className="h-5 w-5 mr-1" />
          Weight Loss Progress
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Starting Weight</p>
            <p className="font-semibold text-lg">{initialWeight} lbs</p>
            <p className="text-xs text-muted-foreground">
              {sortedRecords.length > 0 && format(new Date(sortedRecords[0].recordedAt), "MMM d, yyyy")}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Weight</p>
            <p className="font-semibold text-lg">{currentWeight} lbs</p>
            <p className="text-xs text-muted-foreground">
              {sortedRecords.length > 0 && format(new Date(sortedRecords[sortedRecords.length - 1].recordedAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        
        {/* Weight Change Banner */}
        <div className="mt-4 p-3 rounded-lg flex items-center justify-between border border-green-200 bg-white">
          <div>
            <p className="text-sm font-medium text-green-800">Total Change</p>
            <div className="flex items-center mt-1">
              {weightChange < 0 ? (
                <span className="inline-flex items-center text-green-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Lost <span className="font-bold mx-1">{Math.abs(weightChange).toFixed(1)}</span> lbs
                </span>
              ) : weightChange > 0 ? (
                <span className="inline-flex items-center text-red-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Gained <span className="font-bold mx-1">{weightChange.toFixed(1)}</span> lbs
                </span>
              ) : (
                <span>No change yet</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-800">Percentage Change</p>
            <p className={`font-bold text-lg ${weightChange < 0 ? "text-green-600" : "text-red-600"}`}>
              {weightChangePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Weight History Timeline */}
      <div className="space-y-4">
        <h3 className="font-semibold">Your Weight History</h3>
        {sortedRecords.map((record, index) => {
          // Calculate difference from previous entry
          const prevWeight = index > 0 ? Number(sortedRecords[index - 1].weight) : Number(record.weight);
          const currentWeight = Number(record.weight);
          const difference = currentWeight - prevWeight;
          
          return (
            <div key={record.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted border border-muted">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{record.weight} lbs</span>
                  <div className="inline-flex items-center text-sm">
                    {index > 0 && (
                      <span className={difference < 0 ? "text-green-600" : difference > 0 ? "text-red-600" : "text-muted-foreground"}>
                        {difference < 0 ? "-" : difference > 0 ? "+" : ""}
                        {Math.abs(difference).toFixed(1)} lbs
                      </span>
                    )}
                  </div>
                </div>
                <time className="text-sm text-muted-foreground block mb-2">
                  {format(new Date(record.recordedAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </time>
                {record.imageUrl && (
                  <div className="mt-2">
                    <div className="relative h-28 w-full md:w-48 overflow-hidden rounded-md border">
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
          );
        })}
      </div>
    </div>
  );
}