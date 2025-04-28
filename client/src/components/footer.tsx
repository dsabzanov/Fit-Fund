import React from "react";
import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/IM_Logo_Full-Color (2).png"
                alt="FitFund Logo"
                className="h-8 w-auto"
              />
              <h3 className="text-xl font-bold">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  FitFund
                </span>
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Transforming fitness motivation through community challenges and financial incentives.
            </p>
            <a href="https://www.ilanamuhlstein.com" target="_blank" rel="noopener noreferrer" className="block mt-3">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/IM_Initials_Black.png"
                  alt="Ilana Muhlstein Logo"
                  className="h-8 w-auto"
                />
                <span className="text-sm font-medium text-gray-700">Visit Ilana Muhlstein's Website</span>
              </div>
            </a>
            <div className="flex space-x-4 mt-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-gray-600 hover:text-primary transition-colors" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-gray-600 hover:text-primary transition-colors" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-gray-600 hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/weekly-game" className="text-gray-600 hover:text-primary transition-colors">
                  Weekly Challenges
                </Link>
              </li>
              <li>
                <Link href="/create-game" className="text-gray-600 hover:text-primary transition-colors">
                  Host a Challenge
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors font-medium">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors font-medium">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="text-sm text-gray-500">
                © {currentYear} FitFund. All rights reserved.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Contact Us
                </a>
                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <span className="text-sm text-gray-500 flex items-center">
                Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> by InspireMotivate Inc.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}