import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, CheckCircle, DollarSign, ExternalLink, Wallet } from "lucide-react";

interface Winner {
  userId: number;
  username: string;
  amount: number;
}

interface PayoutInstruction {
  username: string;
  userId: number;
  stripeAccountId: string;
  amount: string;
  payoutUrl: string;
}

interface PayoutResponse {
  message: string;
  challenge: number;
  payoutInstructions: PayoutInstruction[];
  totalAmount: string;
}

export default function WinnerPayoutPanel({ challengeId }: { challengeId: number }) {
  const { toast } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [newWinner, setNewWinner] = useState<Winner>({ userId: 0, username: "", amount: 0 });
  const [payoutResponse, setPayoutResponse] = useState<PayoutResponse | null>(null);

  const addWinner = () => {
    if (!newWinner.userId || !newWinner.username || !newWinner.amount) {
      toast({
        title: "Invalid winner details",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setWinners([...winners, { ...newWinner }]);
    setNewWinner({ userId: 0, username: "", amount: 0 });
  };

  const removeWinner = (index: number) => {
    const updatedWinners = [...winners];
    updatedWinners.splice(index, 1);
    setWinners(updatedWinners);
  };

  const processPayoutMutation = useMutation({
    mutationFn: async () => {
      if (winners.length === 0) {
        throw new Error("No winners specified");
      }

      const winnerPayouts = winners.map(winner => ({
        userId: winner.userId,
        amount: winner.amount
      }));

      const res = await apiRequest("POST", `/api/admin/challenges/${challengeId}/process-payouts`, {
        winnerPayouts
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process payouts");
      }

      return res.json();
    },
    onSuccess: (data: PayoutResponse) => {
      setPayoutResponse(data);
      toast({
        title: "Payout instructions generated",
        description: "Follow the instructions to complete the payouts manually in Stripe",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payout processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalPayout = winners.reduce((sum, winner) => sum + winner.amount, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Winner Payouts
        </CardTitle>
        <CardDescription>
          Process payouts to challenge winners via Stripe Connect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {payoutResponse ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Payout Instructions Generated</AlertTitle>
              <AlertDescription>
                Use the links below to complete manual payouts in Stripe
              </AlertDescription>
            </Alert>

            <div className="rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Summary</h3>
              <div className="text-sm">
                <p><span className="font-medium">Challenge ID:</span> {payoutResponse.challenge}</p>
                <p><span className="font-medium">Total Amount:</span> ${payoutResponse.totalAmount}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Payout Links</h3>
              <ScrollArea className="h-64 rounded-md border">
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutResponse.payoutInstructions.map((instruction, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{instruction.username}</TableCell>
                          <TableCell>${instruction.amount}</TableCell>
                          <TableCell>
                            <a 
                              href={instruction.payoutUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Pay in Stripe
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>

            <div className="mt-4">
              <Alert className="bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  After processing each payout in Stripe, mark it as complete in your records.
                  The platform fee (35%) has already been calculated and applied.
                </AlertDescription>
              </Alert>
            </div>

            <Button
              variant="outline"
              onClick={() => setPayoutResponse(null)}
              className="mt-2"
            >
              Reset & Create New Payout
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Add Winners</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="number"
                    value={newWinner.userId || ""}
                    onChange={(e) => setNewWinner({ ...newWinner, userId: parseInt(e.target.value) || 0 })}
                    placeholder="User ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newWinner.username}
                    onChange={(e) => setNewWinner({ ...newWinner, username: e.target.value })}
                    placeholder="Username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <div className="flex items-center">
                    <Input
                      id="amount"
                      type="number"
                      value={newWinner.amount || ""}
                      onChange={(e) => setNewWinner({ ...newWinner, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="rounded-r-none"
                    />
                    <Button 
                      onClick={addWinner}
                      className="rounded-l-none"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {winners.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Winners List</h3>
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Amount ($)</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {winners.map((winner, index) => (
                          <TableRow key={index}>
                            <TableCell>{winner.userId}</TableCell>
                            <TableCell>{winner.username}</TableCell>
                            <TableCell>${winner.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWinner(index)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Total Payout:</p>
                <p className="text-2xl font-bold">${totalPayout.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform fee (35%): ${(totalPayout * 0.35).toFixed(2)}
                </p>
              </div>

              <Button
                onClick={() => processPayoutMutation.mutate()}
                disabled={winners.length === 0 || processPayoutMutation.isPending}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Process Payouts
              </Button>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Ensure all winners have completed Stripe Connect onboarding before processing payouts.
                The system will validate each recipient's account status.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-slate-50 border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-2">Manual Process</Badge>
          Winners must have completed Stripe Connect onboarding to receive payouts
        </p>
      </CardFooter>
    </Card>
  );
}