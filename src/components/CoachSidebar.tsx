import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import AITrainerChat from "./AITrainerChat";

interface CoachSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const CoachSidebar = ({ isOpen, onToggle }: CoachSidebarProps) => {
  return (
    <>
      {/* Floating Toggle Button - Always Visible */}
      <Button
        onClick={onToggle}
        className={`fixed bottom-8 z-50 h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-elegant transition-all duration-300 ${
          isOpen ? 'right-[22rem]' : 'right-6'
        }`}
        size="icon"
        title="Personal Coach"
      >
        {isOpen ? (
          <ChevronRight className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-medium">Your Personal Coach</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <AITrainerChat />
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default CoachSidebar;