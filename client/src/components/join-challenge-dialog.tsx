import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createPaymentSession } from "@/lib/stripe";

interface JoinChallengeDialogProps {
  challengeId: number;
  entryFee: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinChallengeDialog({
  challengeId,
  entryFee,
  open,
  onOpenChange,
}: JoinChallengeDialogProps) {
  const { toast } = useToast();
  const [weight, setWeight] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
        throw new Error("Please enter a valid weight");
      }

      const res = await apiRequest(
        "POST",
        `/api/challenges/${challengeId}/join`,
        {
          startWeight: Number(weight)
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join challenge");
      }

      return res.json();
    },
    onSuccess: async () => {
      try {
        toast({
          title: "Success",
          description: "Successfully joined the challenge. Proceeding to payment...",
        });
        await createPaymentSession(challengeId, entryFee);
        setWeight("");
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}`] });
      } catch (error) {
        console.error('Payment session error:', error);
        toast({
          title: "Error",
          description: "Failed to create payment session. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onEscapeKeyDown={() => onOpenChange(false)}
        aria-describedby="join-challenge-description"
      >
        <DialogHeader>
          <DialogTitle>Join Challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="weight" className="text-sm font-medium">
              Starting Weight (lbs)
            </label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter your weight (e.g. 150.5)"
              aria-required="true"
              aria-invalid={!weight || isNaN(Number(weight)) || Number(weight) <= 0}
              aria-describedby="weight-description"
            />
            <div id="weight-description" className="text-sm text-muted-foreground mt-1">
              Enter your current weight in pounds (lbs)
            </div>
          </div>
          <Button 
            onClick={() => mutation.mutate()} 
            className="w-full" 
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Join Challenge (${entryFee})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}