import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWeightRecordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WeightFormProps {
  challengeId: number;
}

export function WeightForm({ challengeId }: WeightFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertWeightRecordSchema),
    defaultValues: {
      challengeId,
      weight: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { weight: number }) => {
      const res = await apiRequest("POST", "/api/weight-records", {
        ...data,
        challengeId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}`] });
      toast({
        title: "Weight Updated",
        description: "Your weight has been recorded successfully.",
      });
      form.reset();
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
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Weight (lbs)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Weight
        </Button>
      </form>
    </Form>
  );
}
