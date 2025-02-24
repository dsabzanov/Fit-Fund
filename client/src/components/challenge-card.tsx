import { Challenge } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Target, Users } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, onJoin }: ChallengeCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{challenge.title}</span>
          <span className="text-sm text-muted-foreground">
            {challenge.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground mb-4">{challenge.description}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Entry Fee: ${challenge.entryFee}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Goal: {challenge.percentageGoal}% weight loss</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/challenge/${challenge.id}`}>
          <Button variant="outline">View Details</Button>
        </Link>
        {challenge.status === 'open' && onJoin && (
          <Button onClick={() => onJoin(challenge)}>Join Challenge</Button>
        )}
      </CardFooter>
    </Card>
  );
}
