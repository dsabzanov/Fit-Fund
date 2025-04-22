import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function RefundPolicy({ variant = "outline", size = "sm" }: { variant?: "outline" | "ghost" | "link"; size?: "sm" | "default" }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-1">
          <Info className="h-4 w-4" /> 
          Refund Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Refund Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">Effective Date: April 17, 2024</p>
          
          <section className="space-y-2">
            <h3 className="font-semibold text-lg">1. Standard Refund Window</h3>
            <p>
              Participants are eligible for a full refund of their entry fee if they request it within 7 days 
              from the official start date of the challenge, not from the date of registration. To initiate a 
              refund, please contact our support team at <a href="mailto:info@iminc.life" className="text-primary hover:underline">info@iminc.life</a> within this 7-day window.
            </p>
          </section>
          
          <section className="space-y-2">
            <h3 className="font-semibold text-lg">2. Refunds After the 7-Day Window</h3>
            <p>
              After the initial 7-day period, refunds are generally not provided. However, exceptions may 
              be considered under the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <span className="font-medium">Medical Conditions:</span> If a participant experiences a 
                medical condition that prevents continued participation, and this condition was not known 
                at the time of registration, a refund may be considered.
              </li>
              <li>
                <span className="font-medium">Pregnancy:</span> If a participant becomes pregnant after 
                registering for a challenge, they may be eligible for a refund or the option to defer 
                participation.
              </li>
            </ul>
            <p>
              To request a refund under these exceptions, please provide appropriate documentation and 
              contact us at <a href="mailto:info@iminc.life" className="text-primary hover:underline">info@iminc.life</a>.
            </p>
          </section>
          
          <section className="space-y-2">
            <h3 className="font-semibold text-lg">3. Installment Payment Plans</h3>
            <p>
              Participants who opt for installment payment plans are committing to complete all scheduled 
              payments. These payments are considered a financial obligation and are not subject to 
              cancellation. Failure to complete installment payments may result in disqualification from 
              the challenge and ineligibility for any associated prizes.
            </p>
          </section>
          
          <section className="space-y-2">
            <h3 className="font-semibold text-lg">4. Disqualification and Forfeiture</h3>
            <p>
              Participants may be disqualified for violating challenge rules, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Engaging in prohibited behaviors as outlined in the challenge guidelines.</li>
              <li>Providing false or misleading information.</li>
            </ul>
            <p>Disqualified participants are not eligible for refunds.</p>
          </section>
          
          <section className="space-y-2">
            <h3 className="font-semibold text-lg">5. Contact Information</h3>
            <p>For any questions or to request a refund, please reach out to our support team:</p>
            <p>Email: <a href="mailto:info@iminc.life" className="text-primary hover:underline">info@iminc.life</a></p>
            <p className="whitespace-pre-line">
              Mailing Address:
              Ilana Muhlstein Inc.
              5665 W. Wilshire Blvd #1174
              Los Angeles, CA 90036
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}