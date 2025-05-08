import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  PlusCircle, 
  CheckCircle2, 
  Star, 
  Trash2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing VITE_STRIPE_PUBLIC_KEY');
}

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment method interface
interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// Setup component to add a new card
function SetupForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/profile',
        },
        redirect: 'if_required'
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message || "Failed to add payment method",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Payment method added successfully",
        });
        // Invalidate payment methods query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          'Add Payment Method'
        )}
      </Button>
    </form>
  );
}

// Add Card Dialog
function AddCardDialog() {
  const [open, setOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  const createSetupIntent = async () => {
    try {
      const response = await apiRequest('POST', '/api/payment-methods/setup');
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment setup",
        variant: "destructive",
      });
      setOpen(false);
    }
  };

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen && !clientSecret) {
      await createSetupIntent();
    }
    setOpen(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Payment Method
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Add Payment Method</AlertDialogTitle>
          <AlertDialogDescription>
            Add a new credit or debit card to your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SetupForm />
          </Elements>
        ) : (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Card display component
function PaymentMethodCard({ 
  method, 
  onSetDefault, 
  onDelete 
}: { 
  method: PaymentMethod; 
  onSetDefault: (id: string) => void; 
  onDelete: (id: string) => void; 
}) {
  return (
    <Card className={method.isDefault ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <CardTitle className="text-base capitalize">
              {method.brand} •••• {method.last4}
            </CardTitle>
          </div>
          {method.isDefault && (
            <Badge variant="outline" className="border-primary text-primary">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Default
            </Badge>
          )}
        </div>
        <CardDescription>
          Expires {method.expMonth}/{method.expYear}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          {!method.isDefault && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onSetDefault(method.id)}
            >
              <Star className="h-4 w-4 mr-1" /> Set Default
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex-1"
            onClick={() => onDelete(method.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Remove
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Delete confirmation dialog
function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  paymentMethod 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  paymentMethod: PaymentMethod | null;
}) {
  if (!paymentMethod) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this payment method?
            <div className="mt-2 font-medium">
              {paymentMethod.brand.toUpperCase()} ending in {paymentMethod.last4}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Main payment methods component
export default function PaymentMethods() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Fetch payment methods
  const { data: paymentMethods, isLoading, error } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-methods');
      const data = await response.json();
      return data as PaymentMethod[];
    }
  });

  // Set default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/payment-methods/${id}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: 'Success',
        description: 'Default payment method updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
  });

  // Delete payment method mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: 'Success',
        description: 'Payment method removed',
      });
      setDeleteDialogOpen(false);
      setSelectedMethod(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove payment method',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
    }
  });

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    const method = paymentMethods?.find(m => m.id === id) || null;
    setSelectedMethod(method);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMethod) {
      deleteMutation.mutate(selectedMethod.id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load your payment methods
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] })}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your saved payment methods for challenge entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentMethods && paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No payment methods</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a payment method to join weight-loss challenges
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <AddCardDialog />
      </CardFooter>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        paymentMethod={selectedMethod}
      />
    </Card>
  );
}