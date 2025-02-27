import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function FitbitConnect() {
  const { user } = useAuth();

  const { data: fitbitStatus, isLoading } = useQuery({
    queryKey: ["/api/fitbit/status"],
    enabled: !!user
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      // Simulate connection success
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fitbit connected successfully! (Simulated)",
      });
      // Force refetch status
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Fitbit (Simulated)",
        variant: "destructive"
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      // Simulate disconnect
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fitbit disconnected successfully! (Simulated)"
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect Fitbit (Simulated)",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fitbit Connection</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitbit Connection</CardTitle>
      </CardHeader>
      <CardContent>
        {fitbitStatus?.connected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connected to Fitbit (Simulated)<br/>
              Steps today: 8,432<br/>
              Active minutes: 45<br/>
              Calories burned: 1,867
            </p>
            <Button 
              variant="destructive" 
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disconnect Fitbit
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Connect Fitbit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}