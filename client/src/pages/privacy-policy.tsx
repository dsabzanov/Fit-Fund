import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: May 8, 2025</p>
        </div>
        
        <div className="prose max-w-none">
          <h2>1. Introduction</h2>
          <p>
            At FitFund, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, process, and store your information when you use our platform.
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>
            We collect the following types of information when you use FitFund:
          </p>
          <h3>2.1 Information You Provide to Us</h3>
          <ul>
            <li><strong>Account Information:</strong> When you register, we collect your name, email address, and username.</li>
            <li><strong>Profile Information:</strong> Information you add to your profile such as profile picture, biographical information, and weight goals.</li>
            <li><strong>Health and Fitness Data:</strong> Information about your weight, weight loss progress, and related metrics that you choose to share.</li>
            <li><strong>Payment Information:</strong> We collect payment method information when you participate in challenges. This information is processed by our payment service provider, Stripe.</li>
            <li><strong>Communications:</strong> Content of messages, comments, and posts you create on the platform.</li>
          </ul>
          
          <h3>2.2 Information We Collect Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Information about how you interact with our platform, including access times, pages viewed, and actions taken.</li>
            <li><strong>Device Information:</strong> Information about the device used to access our platform, including hardware model, operating system, and browser type.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity on our platform and hold certain information.</li>
          </ul>
          
          <h2>3. How We Use Your Information</h2>
          <p>
            We use the information we collect for the following purposes:
          </p>
          <ul>
            <li>To provide and maintain our service, including to monitor the usage of our service.</li>
            <li>To manage your account, including to verify your identity for security purposes.</li>
            <li>To process your payments and track your challenge participation.</li>
            <li>To communicate with you, including sending notifications about weight tracking, challenge updates, and promotional materials.</li>
            <li>To improve our service and develop new features.</li>
            <li>To comply with legal obligations and resolve disputes.</li>
          </ul>
          
          <h2>4. Sharing Your Information</h2>
          <p>
            We may share your information with:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> We may share your information with third-party service providers to perform services on our behalf, such as payment processing, data analysis, email delivery, and hosting services.</li>
            <li><strong>Challenge Participants:</strong> Certain information, such as your username, profile picture, and progress updates, may be visible to other participants in challenges you join.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information to comply with applicable laws, regulations, legal processes, or governmental requests.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
          </ul>
          
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
          </p>
          
          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul>
            <li>The right to access and receive a copy of your personal data.</li>
            <li>The right to rectify or update your personal data.</li>
            <li>The right to erase your personal data in certain circumstances.</li>
            <li>The right to restrict processing of your personal data.</li>
            <li>The right to data portability.</li>
            <li>The right to object to the processing of your personal data.</li>
          </ul>
          <p>
            If you wish to exercise any of these rights, please contact us at <a href="mailto:privacy@fitfund.com">privacy@fitfund.com</a>.
          </p>
          
          <h2>7. Third-Party Services</h2>
          <p>
            Our service may contain links to other websites or services that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
          </p>
          <p>
            We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>
          
          <h2>8. Email Marketing</h2>
          <p>
            With your permission, we may send you emails about our platform, new challenges, and other updates. You can opt out of receiving these communications at any time by clicking the unsubscribe link in the emails or by contacting us directly.
          </p>
          
          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not intended for use by children under the age of 18. We do not knowingly collect personally identifiable information from children under 18. If you are a parent or guardian and become aware that your child has provided us with personal data, please contact us.
          </p>
          
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
          
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <p>
            By email: <a href="mailto:privacy@fitfund.com">privacy@fitfund.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}