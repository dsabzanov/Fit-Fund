import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";
import { WeightForm } from "@/components/weight-form";
import { WeightHistory } from "@/components/weight-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WeightTrackingPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const challengeId = parseInt(params.id);
  const { toast } = useToast();

  // Query to check if user has paid for the challenge
  const { data: participant, isLoading, error } = useQuery({
    queryKey: [`/api/challenges/${challengeId}/participants/${user?.id}`],
    enabled: !!user?.id && !!challengeId,
  });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Error loading participant information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user hasn't paid, show message
  if (!participant?.paid) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Please complete the payment process to access weight tracking.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Weight Tracking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content - Weight History */}
        <div className="lg:col-span-8">
          <WeightHistory challengeId={challengeId} userId={user.id} />
        </div>

        {/* Sidebar - Weight Form */}
        <div className="lg:col-span-4">
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle>Log Your Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}