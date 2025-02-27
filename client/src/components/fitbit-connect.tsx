import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SiFitbit } from "react-icons/si";

export function FitbitConnect() {
  return (
    <Card className="w-[300px] bg-gradient-to-br from-[#00B2B2] to-[#007C83]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SiFitbit className="h-6 w-6 text-white" />
          <CardTitle className="text-white">Fitbit Stats</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium text-white/90">Today's Activity:</p>
            <ul className="space-y-2 text-white/80">
              <li className="flex justify-between">
                <span>Steps</span>
                <span className="font-mono">8,432</span>
              </li>
              <li className="flex justify-between">
                <span>Active Minutes</span>
                <span className="font-mono">45</span>
              </li>
              <li className="flex justify-between">
                <span>Calories</span>
                <span className="font-mono">1,867</span>
              </li>
              <li className="flex justify-between">
                <span>Distance</span>
                <span className="font-mono">5.2 km</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}