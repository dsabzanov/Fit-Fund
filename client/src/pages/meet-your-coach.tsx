import React from 'react';
import { Footer } from "@/components/footer";
import { HomeButton } from "@/components/home-button";

export default function MeetYourCoachPage() {
  return (
    <div className="min-h-screen bg-background">
      <HomeButton />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div 
            className="h-48 bg-gradient-to-r from-primary/80 to-primary/20 flex items-center justify-center relative"
          >
            <h1 className="text-4xl font-bold text-white text-center z-10">Meet Your Coach</h1>
            <div className="absolute inset-0 bg-grid-white/10" />
          </div>
          
          <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <img 
                src="/assets/ilana-headshot.jpg"
                alt="Ilana Muhlstein headshot"
                className="rounded-lg shadow-lg w-full md:w-1/3 max-w-xs object-cover"
              />
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Ilana Muhlstein, <span className="text-primary">MS, RDN</span>
                </h2>
                
                <p className="text-lg font-medium text-gray-700">
                  Ilana isn't just your coach—she's your biggest cheerleader.
                </p>
                
                <p className="text-gray-600">
                  As a Registered Dietitian Nutritionist, bestselling author, and creator of the 2B Mindset weight loss program, 
                  Ilana has helped hundreds of thousands of people transform their bodies, their health, and their relationship with food.
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Her Journey</h3>
              
              <p className="text-gray-600 mb-4">
                But here's the best part: she's been in your shoes. Ilana lost over 100 pounds herself—and kept it off—while
                juggling real life as a mom of three and full-time professional. Her approach is practical, flexible, and empowering.
              </p>
              
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 my-6">
                <h4 className="font-semibold text-gray-800 mb-4">With Ilana as your guide in FitFund, you'll get:</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">✓</span>
                    <span>Proven tools and strategies that actually fit your life</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">✓</span>
                    <span>Encouragement without judgment</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-primary">✓</span>
                    <span>A clear, motivating path toward your goals</span>
                  </li>
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="bg-primary/5 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Bestselling Author</h4>
                  <p className="text-gray-600 text-sm">
                    Ilana's book "You Can Drop It!" became an instant hit, sharing her practical approach to sustainable weight loss.
                  </p>
                </div>
                
                <div className="bg-primary/5 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Nutrition Expert</h4>
                  <p className="text-gray-600 text-sm">
                    With a Master's degree in Nutrition and Dietetics, Ilana brings science-backed methods to weight management.
                  </p>
                </div>
                
                <div className="bg-primary/5 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Program Creator</h4>
                  <p className="text-gray-600 text-sm">
                    The 2B Mindset program has helped countless people transform their relationship with food and find lasting results.
                  </p>
                </div>
                
                <div className="bg-primary/5 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Real Results</h4>
                  <p className="text-gray-600 text-sm">
                    Ilana's personal 100-pound weight loss journey informs her approach and helps her connect with clients.
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 font-medium text-lg text-center">
                She gets it. She lives it. And she's here to help you thrive. 💚
              </p>
              
              <div className="flex justify-center mt-8">
                <a 
                  href="https://www.ilanamuhlstein.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <span>Visit Ilana's Website</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}