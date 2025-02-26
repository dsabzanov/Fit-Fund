import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertParticipantSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createPaymentSession } from "@/lib/stripe";

interface JoinChallengeDialogProps {
  challengeId: number;
  entryFee: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinChallengeDialog({ challengeId, entryFee, open, onOpenChange }: JoinChallengeDialogProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertParticipantSchema),
    defaultValues: {
      startWeight: 0,
      challengeId,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { startWeight: number }) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/join`, {
        startWeight: Number(data.startWeight),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join challenge");
      }
      return res.json();
    },
    onSuccess: async () => {
      try {
        await createPaymentSession(challengeId, entryFee);
        onOpenChange(false);
      } catch (error) {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Challenge</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            mutation.mutate({ startWeight: Number(data.startWeight) });
          })} className="space-y-4">
            <FormField
              control={form.control}
              name="startWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Challenge (${entryFee})
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}