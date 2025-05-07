import { Challenge } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Target, Users, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { JoinChallengeDialog } from "./join-challenge-dialog";
import { ShareButton } from "./share-button";
import { Badge } from "@/components/ui/badge";

interface ChallengeCardProps {
  challenge: Challenge;
}

// Array of fitness-related images
const challengeImages = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=500",
  "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=500"
];

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Get a consistent image for each challenge based on its ID
  const imageUrl = challengeImages[challenge.id % challengeImages.length];
  
  // Calculate days until start and the join window
  const today = new Date();
  const startDate = new Date(challenge.startDate);
  const daysUntilStart = differenceInDays(startDate, today);
  const joinWindowText = daysUntilStart > 0 
    ? `${daysUntilStart} days until start` 
    : "Challenge in progress";
  
  // Placeholder for participant count
  const participantCount = Math.floor(Math.random() * 15) + 3; // Mock data, replace with API call

  return (
    <Card 
      className="h-full flex flex-col" 
      role="article" 
      aria-label={`Challenge: ${challenge.title}`}
      tabIndex={0}
    >
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-4 w-full">
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-white">{challenge.title}</CardTitle>
            <Badge 
              variant={challenge.status === 'open' ? "default" : "secondary"}
              className="text-xs"
            >
              {challenge.status === 'open' ? 'Open' : 'Closed'}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-white/80">
            <Users className="h-3 w-3" />
            <span>{participantCount} participants</span>
            <span className="mx-1">•</span>
            <Clock className="h-3 w-3" />
            <span>{joinWindowText}</span>
          </div>
        </div>
      </div>
      <CardContent className="flex-grow pt-4">
        <p className="text-muted-foreground mb-4" aria-label="Challenge description">
          {challenge.description}
        </p>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2" role="list" aria-label="Challenge details">
            <div className="flex items-center gap-2" role="listitem">
              <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
              <span aria-label="Challenge duration">
                {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
              <span aria-label="Entry fee">Entry Fee: ${challenge.entryFee}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              <span aria-label="Weight loss goal">Goal: {challenge.percentageGoal}% weight loss</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Link href={`/challenge/${challenge.id}`}>
          <Button 
            variant="outline" 
            aria-label={`View details for ${challenge.title} challenge`}
          >
            View Challenge
          </Button>
        </Link>
        <div className="flex gap-2">
          <ShareButton 
            challenge={challenge} 
            variant="outline"
            size="default"
          />
          {challenge.status === 'open' && (
            <Button 
              onClick={() => setShowJoinDialog(true)}
              aria-label={`Join ${challenge.title} challenge`}
            >
              Join Challenge
            </Button>
          )}
        </div>
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