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
  const baseUrl = window.location.origin;
  const challengeUrl = `${baseUrl}/challenge/${challenge.id}`;

  const defaultMessage = `Join me in the "${challenge.title}" fitness challenge on FitFund! 🏋️‍♂️`;
  const shareMessage = customMessage || defaultMessage;

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

  // For Instagram sharing via Stories
  const shareToInstagram = () => {
    // Instagram doesn't have a direct web sharing API
    // Best approach is to copy the link to clipboard and guide user to share it on Instagram
    navigator.clipboard.writeText(challengeUrl)
      .then(() => {
        alert("Link copied to clipboard! Open Instagram and paste the link in your story or message.");
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        alert("Please copy this link manually: " + challengeUrl);
      });
  };

  // For TikTok sharing
  const shareToTikTok = () => {
    // TikTok doesn't have a direct web sharing API either
    // Similar to Instagram, guide the user to copy the link and share it on TikTok
    navigator.clipboard.writeText(challengeUrl)
      .then(() => {
        alert("Link copied to clipboard! Open TikTok and paste the link in your video description or message.");
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        alert("Please copy this link manually: " + challengeUrl);
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={shareViaWebShare} className="cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          Share Challenge
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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