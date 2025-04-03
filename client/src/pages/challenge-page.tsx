import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Challenge, Participant, WeightRecord, ChatMessage } from "@shared/schema";
import { WeightForm } from "@/components/weight-form";
import { Leaderboard } from "@/components/leaderboard";
import { CommunityFeed } from "@/components/community-feed";
import { Feed } from "@/components/feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, Target, Users, Loader2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Crown, Shield } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WeightHistory } from "@/components/weight-history";
import { ShareButton } from "@/components/share-button";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ChallengePage() {
  const { user } = useAuth();
  const [match, params] = useRoute<{ id: string }>("/challenge/:id");
  const challengeId = match && params ? parseInt(params.id) : NaN;

  const { data: challenge, isLoading: isLoadingChallenge, error } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${challengeId}`],
    enabled: !isNaN(challengeId),
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: [`/api/challenges/${challengeId}/participants`],
    enabled: !isNaN(challengeId),
  });

  const { data: weightRecords = [] } = useQuery<WeightRecord[]>({
    queryKey: [`/api/challenges/${challengeId}/weight-records`],
    enabled: !isNaN(challengeId),
  });

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/challenges/${challengeId}/chat`],
    enabled: !isNaN(challengeId),
  });
  
  // States for scheduling dialog
  const [schedulingDialogOpen, setSchedulingDialogOpen] = useState(false);
  const [scheduledPostContent, setScheduledPostContent] = useState("");
  const [scheduledPostDate, setScheduledPostDate] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  
  // Handle scheduling post
  const schedulePostMutation = useMutation({
    mutationFn: async (data: { content: string, scheduledFor: string }) => {
      return apiRequest("POST", `/api/challenges/${challengeId}/feed-posts/schedule`, {
        content: data.content,
        scheduledFor: new Date(data.scheduledFor).toISOString(),
        challengeId,
        userId: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/feed-posts`] });
      setSchedulingDialogOpen(false);
      setScheduledPostContent("");
      setScheduledPostDate("");
    }
  });

  if (isNaN(challengeId) || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Invalid Challenge ID</h1>
          <p className="text-muted-foreground mt-2">Please check the URL and try again.</p>
          <Link href="/">
            <Button variant="link" className="mt-4">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingChallenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Challenge Not Found</h1>
          <p className="text-muted-foreground mt-2">The challenge you're looking for doesn't exist.</p>
          <Link href="/">
            <Button variant="link" className="mt-4">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(challenge.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const progress = Math.min(
    100,
    ((new Date().getTime() - new Date(challenge.startDate).getTime()) /
      (new Date(challenge.endDate).getTime() -
        new Date(challenge.startDate).getTime())) *
      100
  );

  const isHost = challenge.userId === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* View Context Banner - always show whether host or participant */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {isHost ? (
              <>
                <Crown className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Host Dashboard</h2>
                <Badge variant="outline" className="bg-primary/5">Host View</Badge>
              </>
            ) : (
              <>
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Challenge View</h2>
                <Badge variant="outline" className="bg-primary/5">Participant View</Badge>
              </>
            )}
          </div>
          
          {isHost ? (
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>
                  <strong>Host Mode Active:</strong> You have access to challenge management features, participant tracking, and communication tools.
                </span>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>You're viewing this challenge as a participant. Track your progress and compete with others!</span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{challenge.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <ShareButton 
                      challenge={challenge}
                      customMessage={`I'm participating in "${challenge.title}" on FitFund! Join me in this ${challenge.percentageGoal}% weight loss challenge. 💪`}
                    />
                    {isHost && (
                      <Badge variant="secondary">
                        <Crown className="h-4 w-4 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {challenge.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>{daysRemaining} days left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" aria-hidden="true" />
                    <span>${challenge.entryFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" aria-hidden="true" />
                    <span>{challenge.percentageGoal}% goal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span>{participants.length} participants</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Challenge Progress: {Math.round(progress)}%
                </p>

                {!isHost && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-600" />
                        Your Challenge Overview
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <span className="font-medium">${challenge.entryFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goal:</span>
                          <span className="font-medium">{challenge.percentageGoal}% weight loss</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="font-medium">{format(new Date(challenge.endDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time Remaining:</span>
                          <span className="font-medium">{daysRemaining} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Participants:</span>
                          <span className="font-medium">{participants.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Potential Prize:</span>
                          <span className="font-medium">${challenge.entryFee * participants.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-blue-600 mt-4">
                      Track your progress by submitting regular weight updates with verification photos. Keep up the good work!
                    </p>
                  </div>
                )}

                {isHost && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium flex items-center">
                        <Crown className="h-4 w-4 mr-2 text-primary" />
                        Host Controls
                      </h3>
                      <Badge variant="outline" className="text-xs">Host Only</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mb-1 bg-white/50 justify-start"
                          onClick={() => setSchedulingDialogOpen(true)}
                        >
                          <span className="mr-2">📅</span>
                          Schedule Motivational Posts
                        </Button>
                        <p className="text-xs text-muted-foreground ml-1">
                          Create and schedule posts to keep participants motivated throughout the challenge
                        </p>
                      </div>
                      
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mb-1 bg-white/50 justify-start"
                        >
                          <span className="mr-2">📧</span>
                          Send Reminder to All
                        </Button>
                        <p className="text-xs text-muted-foreground ml-1">
                          Send notifications to all participants reminding them to submit their weights
                        </p>
                      </div>
                      
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mb-1 bg-white/50 justify-start"
                        >
                          <span className="mr-2">📊</span>
                          View Detailed Stats
                        </Button>
                        <p className="text-xs text-muted-foreground ml-1">
                          Access comprehensive statistics on participant progress, trends, and challenge metrics
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Feed challengeId={challengeId} />
            
            {/* Only show community feed to hosts for better focus on challenge for participants */}
            {isHost && (
              <CommunityFeed challengeId={challengeId} initialMessages={chatMessages} />
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Track Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Quick Weight Update</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Track your progress by submitting your current weight. Don't forget to include a verification photo!
                    </p>
                    <WeightForm challengeId={challengeId} />
                  </div>

                  <Alert className="bg-muted/50">
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

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Your Progress History</h3>
                    <WeightHistory challengeId={challengeId} userId={user?.id || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Leaderboard
              participants={participants}
              weightRecords={weightRecords}
              isHost={isHost}
            />
          </div>
        </div>
      </div>

      {/* Scheduling Dialog */}
      <Dialog open={schedulingDialogOpen} onOpenChange={setSchedulingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule a Motivational Post</DialogTitle>
            <DialogDescription>
              Create a post that will automatically be published at the scheduled time to keep participants motivated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduled-date" className="text-right">
                Date & Time
              </Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledPostDate}
                onChange={(e) => setScheduledPostDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                max={new Date(challenge.endDate).toISOString().slice(0, 16)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right align-top pt-2">
                Message
              </Label>
              <Textarea
                id="content"
                placeholder="Write your motivational message here..."
                value={scheduledPostContent}
                onChange={(e) => setScheduledPostContent(e.target.value)}
                className="col-span-3 min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setSchedulingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                schedulePostMutation.mutate({
                  content: scheduledPostContent,
                  scheduledFor: scheduledPostDate
                });
              }}
              disabled={!scheduledPostContent || !scheduledPostDate || schedulePostMutation.isPending}
            >
              {schedulePostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}