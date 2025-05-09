import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  const [_, navigate] = useLocation();

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2" 
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last Updated: May 8, 2025</p>
        </div>
        
        <div className="prose max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            Welcome to FitFund. By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
          
          <h2>2. Description of Service</h2>
          <p>
            FitFund provides a platform for users to participate in weight loss challenges, track their progress, and compete for prize money. Our service includes the following key features:
          </p>
          <ul>
            <li>Creation and participation in time-bound weight loss challenges</li>
            <li>Payment processing for challenge entry fees and prize payouts</li>
            <li>Weight tracking and verification</li>
            <li>Social community features including posts, comments, and messaging</li>
            <li>Expert guidance from nutrition and fitness professionals</li>
          </ul>
          
          <h2>3. User Accounts</h2>
          <p>
            To use certain features of our service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. We encourage the use of strong passwords and discourage sharing your password with any third party.
          </p>
          
          <h2>4. Challenge Participation and Payments</h2>
          <p>
            4.1 <strong>Entry Fees:</strong> By joining a challenge, you agree to pay the specified entry fee. All fees are non-refundable once a challenge has begun.
          </p>
          <p>
            4.2 <strong>Prize Distribution:</strong> Prize money will be distributed according to the rules specified for each challenge. FitFund retains 35% of the total pot as a platform fee. The remaining 65% is distributed among winners.
          </p>
          <p>
            4.3 <strong>Payment Processing:</strong> All payments are processed through Stripe, a third-party payment processor. By making a payment, you agree to Stripe's terms of service.
          </p>
          <p>
            4.4 <strong>Payout Eligibility:</strong> To receive payouts, you must complete the Stripe Connect onboarding process and provide all required information.
          </p>
          
          <h2>5. Weight Verification</h2>
          <p>
            5.1 <strong>Verification Process:</strong> All weight submissions are subject to verification by our team. We may request additional information or photos to verify your submissions.
          </p>
          <p>
            5.2 <strong>Fraudulent Submissions:</strong> Any attempt to submit fraudulent weight data may result in disqualification from challenges and termination of your account without refund.
          </p>
          
          <h2>6. Health Disclaimer</h2>
          <p>
            FitFund is not a medical service and does not provide medical advice. The information and services provided are not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
          <p>
            We recommend a moderate weight loss goal of no more than 10% of your starting weight over a 4-week period. Rapid weight loss may be unsafe and is not encouraged by our platform.
          </p>
          
          <h2>7. Content Ownership and Guidelines</h2>
          <p>
            7.1 <strong>User Content:</strong> You retain ownership of any content you post on FitFund. By posting content, you grant us a worldwide, non-exclusive license to use, reproduce, modify, and display such content in connection with the service.
          </p>
          <p>
            7.2 <strong>Content Guidelines:</strong> You agree not to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. We reserve the right to remove any content that violates these guidelines.
          </p>
          
          <h2>8. Termination</h2>
          <p>
            We may terminate or suspend your account at our sole discretion, without prior notice or liability, for any reason, including without limitation if you breach the Terms.
          </p>
          
          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
          
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:support@fitfund.com">support@fitfund.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}