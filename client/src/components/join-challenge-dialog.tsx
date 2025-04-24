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
import { RefundPolicy } from "./refund-policy";

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
  const [weightError, setWeightError] = useState("");
  
  const validateWeight = () => {
    if (!weight) {
      setWeightError("Weight is required");
      return false;
    }
    
    const weightNum = Number(weight);
    if (isNaN(weightNum)) {
      setWeightError("Please enter a valid number");
      return false;
    }
    
    if (weightNum <= 0) {
      setWeightError("Weight must be greater than 0");
      return false;
    }
    
    if (weightNum < 50) {
      setWeightError("Weight seems too low. Please check your entry");
      return false;
    }
    
    if (weightNum > 1000) {
      setWeightError("Weight seems too high. Please check your entry");
      return false;
    }
    
    setWeightError("");
    return true;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!validateWeight()) {
        throw new Error(weightError || "Please enter a valid weight");
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
              onChange={(e) => {
                setWeight(e.target.value);
                // Clear previous error
                setWeightError("");
                
                // Optional immediate validation for better UX
                const val = e.target.value;
                const numVal = Number(val);
                
                if (val && (isNaN(numVal) || numVal <= 0)) {
                  setWeightError("Please enter a valid weight");
                }
              }}
              placeholder="Enter your weight (e.g. 150.5)"
              aria-required="true"
              aria-invalid={!!weightError}
              aria-describedby="weight-description"
              className={weightError ? "border-red-500" : ""}
              onBlur={() => validateWeight()}
            />
            <div id="weight-description" className="text-sm mt-1 flex flex-col">
              <span className="text-muted-foreground">Enter your current weight in pounds (lbs)</span>
              {weightError && <span className="text-red-500 font-medium">{weightError}</span>}
            </div>
          </div>
          <div className="space-y-3">
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
            
            <div className="text-xs text-muted-foreground text-center">
              By joining, you agree to our <RefundPolicy variant="link" size="sm" /> and challenge terms.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}