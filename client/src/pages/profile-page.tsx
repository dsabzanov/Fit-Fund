import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

  // Parse URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(new URLSearchParams(window.location.search));
    }
  }, []);

  // Check for Stripe onboarding return status
  useEffect(() => {
    if (urlParams) {
      const stripeStatus = urlParams.get('stripe');
      if (stripeStatus === 'success') {
        toast({
          title: "Stripe Connect Setup Progress",
          description: "Your account setup is being processed. It may take a few minutes to complete.",
        });
        // Clear the URL params after handling
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (stripeStatus === 'refresh') {
        toast({
          title: "Stripe Connect Setup Incomplete",
          description: "Please complete the Stripe Connect onboarding process to receive payouts.",
          variant: "destructive"
        });
        // Clear the URL params after handling
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [urlParams, toast]);

  // Get Stripe Connect account status
  const { 
    data: accountStatus, 
    isLoading: isLoadingStatus,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ['/api/stripe/account-status'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/stripe/account-status');
        if (!res.ok) {
          throw new Error('Failed to get account status');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching Stripe Connect status:', error);
        return { hasAccount: false };
      }
    },
    enabled: !!user,
  });

  // Create or get Stripe Connect account link
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe/create-connect-account');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create Stripe Connect account');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // If we got a URL, redirect to Stripe Connect onboarding
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Otherwise, refetch the account status to update UI
        refetchStatus();
        toast({
          title: "Stripe Connect Setup",
          description: "Your account is already set up for payouts.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Stripe Connect Setup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateAccount = () => {
    createAccountMutation.mutate();
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not logged in</AlertTitle>
          <AlertDescription>
            You need to be logged in to access this page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation('/auth')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="text-lg">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">
                {user.firstName || user.lastName 
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
                  : "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user.email || "No email provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <div className="flex items-center gap-2 mt-1">
                {user.isHost && <Badge variant="outline">Host</Badge>}
                {user.isAdmin && <Badge variant="outline" className="bg-red-100">Admin</Badge>}
                {!user.isHost && !user.isAdmin && <Badge variant="outline">Participant</Badge>}
              </div>
            </div>
            <Separator className="my-2" />
            <div className="pt-2">
              <Button onClick={() => setLocation('/edit-profile')} className="w-full">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect Integration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>Setup your account to receive challenge payouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Stripe Connect Status</h3>
              
              {isLoadingStatus ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-1/3" />
                </div>
              ) : accountStatus?.hasAccount ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Account ID:</p>
                    <p className="text-sm font-mono">{accountStatus.accountId}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Onboarding Status:</p>
                      {accountStatus.onboardingComplete ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Incomplete
                        </Badge>
                      )}
                    </div>
                    
                    {!accountStatus.onboardingComplete && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Action Required</AlertTitle>
                        <AlertDescription>
                          Your Stripe Connect account setup is incomplete. You need to complete the onboarding process to receive payouts.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={handleCreateAccount}
                      disabled={createAccountMutation.isPending}
                      className="mt-2"
                    >
                      {createAccountMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      {accountStatus.onboardingComplete ? 'View Stripe Account' : 'Complete Onboarding'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="ml-3"
                      onClick={() => refetchStatus()}
                      disabled={isLoadingStatus}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                      Refresh Status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Payout Method Setup</AlertTitle>
                    <AlertDescription>
                      You need to set up a Stripe Connect account to receive payouts if you win challenges.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleCreateAccount}
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Set Up Payout Method
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="pt-2">
              <h3 className="text-lg font-medium mb-3">About Stripe Connect</h3>
              <p className="text-sm text-muted-foreground">
                Stripe Connect is our secure payout method for challenge winners. When you win a challenge, 
                your prize money will be sent directly to your connected account. All data is securely stored 
                and processed by Stripe, ensuring your financial information remains protected.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}