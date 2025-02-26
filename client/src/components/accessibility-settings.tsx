import { useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { AccessibilityContext } from "./accessibility-provider";

export function AccessibilitySettings() {
  const { highContrast, toggleHighContrast } = useContext(AccessibilityContext);

  if (!toggleHighContrast) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9"
          aria-label="Accessibility Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast" className="text-base">
              High Contrast Mode
              <span className="block text-sm text-muted-foreground">
                Increases contrast for better visibility
              </span>
            </Label>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={toggleHighContrast}
              aria-label="Toggle high contrast mode"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Keyboard Shortcuts</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Press Alt + H to toggle high contrast mode</p>
              <p>• Press Alt + / to open accessibility settings</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}