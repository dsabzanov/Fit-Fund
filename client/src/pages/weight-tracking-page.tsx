import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";
import { WeightForm } from "@/components/weight-form";
import { WeightHistory } from "@/components/weight-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WeightTrackingPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const challengeId = parseInt(params.id);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Weight Tracking</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log Your Weight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Track your progress by submitting your current weight. Don't forget to include a verification photo!
              </p>
              <WeightForm challengeId={challengeId} />
            </div>

            <Alert>
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
          </CardContent>
        </Card>
        <WeightHistory challengeId={challengeId} userId={user.id} />
      </div>
    </div>
  );
}