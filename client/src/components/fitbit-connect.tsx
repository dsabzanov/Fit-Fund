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
      const response = await fetch("/api/fitbit/connect", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to initiate Fitbit connection");
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Fitbit",
        variant: "destructive"
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/fitbit/disconnect", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to disconnect Fitbit");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fitbit disconnected successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect Fitbit",
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
              Connected to Fitbit as {fitbitStatus.username}
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
