import { Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function HomeButton() {
  return (
    <Link href="/">
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-4 left-4 z-50 bg-white/90 hover:bg-white"
        aria-label="Go to home page"
      >
        <Home className="h-5 w-5" />
      </Button>
    </Link>
  );
}