import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertParticipantSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  const form = useForm({
    resolver: zodResolver(insertParticipantSchema),
    defaultValues: {
      startWeight: "",
      challengeId,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { startWeight: string | number }) => {
      console.log('Join request:', { ...data, challengeId });
      const res = await apiRequest(
        "POST",
        `/api/challenges/${challengeId}/join`,
        {
          startWeight: data.startWeight,
          challengeId,
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
        form.reset();
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
      console.error('Join challenge error:', error);
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
          <form
            onSubmit={form.handleSubmit((data) => {
              console.log('Form data:', data);
              mutation.mutate(data);
            })}
            className="space-y-4"
          >
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
                      onChange={(e) => field.onChange(e.target.value)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Join Challenge (${entryFee})
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
