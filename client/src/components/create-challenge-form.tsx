import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChallengeSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Crown } from "lucide-react";
import { format } from "date-fns";

export function CreateChallengeForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertChallengeSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      entryFee: 50, // Default to $50
      percentageGoal: 4, // Default to 4%
      status: "open",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        entryFee: Number(data.entryFee),
        percentageGoal: Number(data.percentageGoal),
      };

      console.log('Creating challenge with data:', formattedData);

      const res = await apiRequest("POST", "/api/challenges", formattedData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }
      return res.json();
    },
    onSuccess: (challenge) => {
      console.log('Challenge created successfully:', challenge);
      
      // Invalidate both open challenges and user challenges queries
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/user"] });
      // Also invalidate the specific challenge endpoint to ensure it's available
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challenge.id}`] });
      
      toast({
        title: "Success",
        description: "Challenge created successfully. You are now the host of this FitFund!",
      });
      
      form.reset();
      
      // If onSuccess callback is provided, call it with the challenge data
      if (onSuccess) {
        onSuccess();
      } else {
        // If no callback is provided, redirect to the challenge page
        setTimeout(() => {
          window.location.href = `/challenge/${challenge.id}`;
        }, 500);
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
    <Form {...form}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Host a FitFund Challenge</h3>
        </div>
        <Badge variant="outline" className="bg-primary/5">
          Host View
        </Badge>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          As a host, you'll be responsible for managing this challenge, encouraging participants, 
          and ensuring everyone stays motivated throughout the journey.
        </AlertDescription>
      </Alert>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenge Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., March 30-Day Challenge" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Describe your challenge and how you'll motivate participants..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="10"
                    max="1000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="percentageGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight Loss Goal (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    max="10"
                    step="0.1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create and Host Challenge
        </Button>
      </form>
    </Form>
  );
}