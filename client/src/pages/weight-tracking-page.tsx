import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";
import { WeightForm } from "@/components/weight-form";
import { WeightHistory } from "@/components/weight-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Participant } from "@shared/schema";
import { HomeButton } from "@/components/home-button";

export default function WeightTrackingPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const challengeId = parseInt(params.id);
  const { toast } = useToast();

  // Query to check if user has paid for the challenge
  const { data: participant, isLoading, error } = useQuery<Participant>({
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
  if (!participant || participant.paid === undefined || participant.paid === false) {
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
    <div className="container mx-auto py-8 relative">
      <HomeButton />
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

                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          Photo Verification Guidelines:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          <li>Take a clear photo of your scale display</li>
                          <li>Make sure the weight shown matches what you entered</li>
                          <li>All submissions are saved to your challenge history</li>
                          <li>Maximum file size: 5MB</li>
                        </ul>
                        <p className="text-xs border-t border-amber-200 pt-2 mt-2">
                          Your weigh-ins are used to calculate your progress percentage and determine winners. Multiple submissions are encouraged throughout the challenge!
                        </p>
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