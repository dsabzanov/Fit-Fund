import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Bell, 
  BellOff, 
  Clock, 
  Scale, 
  Megaphone, 
  RefreshCw, 
  Loader2
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Notification settings interface
interface NotificationSettings {
  weigh_in_reminders: boolean;
  start_date_changes: boolean;
  promotional_updates: boolean;
}

// Default settings for new users
const defaultSettings: NotificationSettings = {
  weigh_in_reminders: true,
  start_date_changes: true,
  promotional_updates: true,
};

export default function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  
  // Fetch notification settings
  const { isLoading, error } = useQuery({
    queryKey: ['/api/notifications/settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/notifications/settings');
        const data = await response.json();
        setSettings(data);
        return data;
      } catch (error) {
        // If settings don't exist yet, use defaults
        setSettings(defaultSettings);
        return defaultSettings;
      }
    },
  });

  // Update notification settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      return await apiRequest('PUT', '/api/notifications/settings', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (setting: keyof NotificationSettings) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      [setting]: !settings[setting],
    };
    
    setSettings(newSettings);
    updateMutation.mutate(newSettings);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Control which emails you receive</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Control which emails you receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load your notification preferences
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] })}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notification Settings
        </CardTitle>
        <CardDescription>Control which emails you receive about your challenges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-primary" />
              <Label htmlFor="weigh_in_reminders" className="flex flex-col">
                <span>Weigh-in Reminders</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receive reminders when it's time for your official weigh-ins
                </span>
              </Label>
            </div>
            <Switch
              id="weigh_in_reminders"
              checked={settings.weigh_in_reminders}
              onCheckedChange={() => handleToggle('weigh_in_reminders')}
              disabled={updateMutation.isPending}
            />
          </div>
          
          <div className="flex items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <Label htmlFor="start_date_changes" className="flex flex-col">
                <span>Start Date Changes</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Get notified when a challenge start date is modified
                </span>
              </Label>
            </div>
            <Switch
              id="start_date_changes"
              checked={settings.start_date_changes}
              onCheckedChange={() => handleToggle('start_date_changes')}
              disabled={updateMutation.isPending}
            />
          </div>
          
          <div className="flex items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <Label htmlFor="promotional_updates" className="flex flex-col">
                <span>Promotional Updates</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receive information about new features and opportunities
                </span>
              </Label>
            </div>
            <Switch
              id="promotional_updates"
              checked={settings.promotional_updates}
              onCheckedChange={() => handleToggle('promotional_updates')}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>
        
        <div className="pt-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            {settings.weigh_in_reminders || 
             settings.start_date_changes || 
             settings.promotional_updates ? (
              <>
                <Bell className="h-4 w-4 mr-1" /> 
                Notifications are enabled
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 mr-1" /> 
                All notifications are disabled
              </>
            )}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allEnabled = {
                weigh_in_reminders: true,
                start_date_changes: true,
                promotional_updates: true,
              };
              
              const allDisabled = {
                weigh_in_reminders: false,
                start_date_changes: false,
                promotional_updates: false,
              };
              
              const someEnabled = 
                settings.weigh_in_reminders || 
                settings.start_date_changes || 
                settings.promotional_updates;
              
              const newSettings = someEnabled ? allDisabled : allEnabled;
              setSettings(newSettings);
              updateMutation.mutate(newSettings);
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {settings.weigh_in_reminders || 
             settings.start_date_changes || 
             settings.promotional_updates
              ? "Disable All"
              : "Enable All"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}