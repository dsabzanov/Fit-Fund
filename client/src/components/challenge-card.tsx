import { Challenge } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Target } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { JoinChallengeDialog } from "./join-challenge-dialog";

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  return (
    <Card 
      className="h-full flex flex-col" 
      role="article" 
      aria-label={`Challenge: ${challenge.title}`}
      tabIndex={0}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{challenge.title}</span>
          <span 
            className="text-sm text-muted-foreground" 
            aria-label={`Challenge status: ${challenge.status}`}
          >
            {challenge.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground mb-4" aria-label="Challenge description">
          {challenge.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2" role="list" aria-label="Challenge details">
            <div className="flex items-center gap-2" role="listitem">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span aria-label="Challenge duration">
                {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              <span aria-label="Entry fee">Entry Fee: ${challenge.entryFee}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <Target className="h-4 w-4" aria-hidden="true" />
              <span aria-label="Weight loss goal">Goal: {challenge.percentageGoal}% weight loss</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* Fix: Use string for the challenge ID in the URL */}
        <Link href={`/challenge/${challenge.id.toString()}`}>
          <Button 
            variant="outline" 
            aria-label={`View details for ${challenge.title}`}
          >
            View Details
          </Button>
        </Link>
        {challenge.status === 'open' && (
          <Button 
            onClick={() => setShowJoinDialog(true)}
            aria-label={`Join ${challenge.title} challenge`}
          >
            Join Challenge
          </Button>
        )}
      </CardFooter>

      <JoinChallengeDialog
        challengeId={challenge.id}
        entryFee={challenge.entryFee}
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
      />
    </Card>
  );
}