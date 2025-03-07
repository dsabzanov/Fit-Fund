import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateGamePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Create Your Own FitFund</h1>
            <p className="text-xl text-muted-foreground">
              Host a custom weight loss challenge for your community
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Game Title</Label>
                  <Input id="title" placeholder="Enter a catchy title for your game" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Weight Loss Goal (%)</Label>
                  <Input id="goal" type="number" placeholder="e.g. 4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input id="duration" type="number" placeholder="e.g. 4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bet">Bet Amount ($)</Label>
                  <Input id="bet" type="number" placeholder="e.g. 40" />
                </div>
              </div>
              <Button size="lg" className="w-full bg-primary text-white">
                Create FitFund
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
