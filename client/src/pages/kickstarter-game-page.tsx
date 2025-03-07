import { Button } from "@/components/ui/button";
import { WeeklyGameInstructions } from "@/components/weekly-game-instructions";

export default function KickstarterGamePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Weekly Kickstarter FitFund</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Kickstart your health journey with a 4% weight loss challenge
          </p>
          <Button size="lg" className="bg-primary text-white">
            Join Now - $40
          </Button>
        </div>

        <WeeklyGameInstructions />
      </main>
    </div>
  );
}
