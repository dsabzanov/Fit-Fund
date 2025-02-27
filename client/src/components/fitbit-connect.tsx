import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function FitbitConnect() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConnected(true);
    setIsLoading(false);
    toast({
      title: "Connected!",
      description: "Fitbit connected successfully (Demo)",
    });
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsConnected(false);
    setIsLoading(false);
    toast({
      title: "Disconnected",
      description: "Fitbit disconnected successfully (Demo)",
    });
  };

  return (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle>Fitbit Integration (Demo)</CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <p className="font-medium text-green-600">✓ Connected to Fitbit</p>
              <p>Today's Activity (Demo Data):</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Steps: 8,432</li>
                <li>Active Minutes: 45</li>
                <li>Calories: 1,867</li>
                <li>Distance: 5.2 km</li>
              </ul>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect Fitbit
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Fitbit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}