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
import { RefundPolicy } from "./refund-policy";

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
    mode: "onChange", // Validate on change for better user feedback
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure dates are properly formatted ISO strings
      const formattedData = {
        ...data,
        // Make sure these are properly formatted as ISO strings for the server
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        // Convert numeric strings to numbers
        entryFee: Number(data.entryFee),
        percentageGoal: Number(data.percentageGoal),
      };

      console.log('Creating challenge with data:', formattedData);

      const res = await apiRequest("POST", "/api/challenges", formattedData);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Challenge creation error:', errorData);
        
        if (errorData.details) {
          // Format Zod validation errors in a readable way
          const errors = errorData.details.map((e: any) => 
            `${e.path.join('.')}: ${e.message}`
          ).join(', ');
          throw new Error(`Validation failed: ${errors}`);
        }
        
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
          and ensuring everyone stays motivated throughout the journey. Please familiarize yourself 
          with our <RefundPolicy variant="link" size="sm" /> that applies to all participants.
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

        <Button 
          type="button" 
          className="w-full" 
          disabled={mutation.isPending}
          onClick={() => {
            console.log("Create challenge button clicked directly");
            
            // Get the form data
            const data = form.getValues();
            console.log("Form data:", data);
            
            // Force all fields to validate and show their validation messages
            form.trigger().then(isValid => {
              console.log("Form is valid:", isValid);
              
              if (isValid) {
                try {
                  // Additional validation checks
                  const startDate = new Date(data.startDate);
                  const endDate = new Date(data.endDate);
                  
                  // Make sure dates are valid
                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.error("Invalid date format", { startDate, endDate });
                    toast({
                      title: "Invalid Dates",
                      description: "Please enter valid dates in the correct format.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Call mutation with the form data
                  mutation.mutate(data);
                  
                  // Show processing toast
                  toast({
                    title: "Processing...",
                    description: "Creating your challenge. Please wait.",
                  });
                } catch (error) {
                  console.error("Error during validation:", error);
                  toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "An unexpected error occurred",
                    variant: "destructive",
                  });
                }
              } else {
                // Get all errors and show them to the user
                const errors = Object.entries(form.formState.errors)
                  .map(([key, error]) => `${key}: ${error?.message}`)
                  .join(', ');
                
                console.error("Form validation errors:", form.formState.errors);
                
                toast({
                  title: "Validation Error",
                  description: errors || "Please fill all required fields correctly.",
                  variant: "destructive",
                });
              }
            });
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Create and Host Challenge
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}