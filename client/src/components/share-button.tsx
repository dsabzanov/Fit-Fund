import { Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Challenge } from "@shared/schema";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  challenge: Challenge;
  customMessage?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({ 
  challenge, 
  customMessage,
  variant = "outline",
  size = "default" 
}: ShareButtonProps) {
  const { toast } = useToast();
  const baseUrl = window.location.origin;
  const challengeUrl = `${baseUrl}/challenge/${challenge.id}`;

  const defaultMessage = `Join me in the "${challenge.title}" fitness challenge on FitFund! 🏋️‍♂️`;
  const shareMessage = customMessage || defaultMessage;

  // For Instagram and TikTok sharing
  const copyToClipboard = (platform: string) => {
    navigator.clipboard.writeText(challengeUrl)
      .then(() => {
        toast({
          title: `Ready to share on ${platform}!`,
          description: `Link copied to clipboard. Open ${platform} and paste in your ${platform === 'Instagram' ? 'story or message' : 'video description'}.`,
          variant: "default",
        });
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Couldn't copy automatically",
          description: "Please copy this link manually: " + challengeUrl,
          variant: "destructive",
        });
      });
  };

  // Share functions
  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: shareMessage,
          url: challengeUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(challengeUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(challengeUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(challengeUrl)}`;
    window.open(linkedinUrl, '_blank');
  };

  const shareToInstagram = () => copyToClipboard('Instagram');
  const shareToTikTok = () => copyToClipboard('TikTok');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={shareViaWebShare} className="cursor-pointer">
              <Share2 className="h-4 w-4 mr-2" />
              Share Challenge
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToLinkedIn} className="cursor-pointer">
          <Linkedin className="h-4 w-4 mr-2" />
          Share on LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToInstagram} className="cursor-pointer">
          <SiInstagram className="h-4 w-4 mr-2" />
          Share on Instagram
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToTikTok} className="cursor-pointer">
          <SiTiktok className="h-4 w-4 mr-2" />
          Share on TikTok
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}