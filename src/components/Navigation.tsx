import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import AuthDialog from "./AuthDialog";

interface NavigationProps {
  isAuthenticated?: boolean;
  userName?: string;
}

const Navigation = ({ isAuthenticated = false, userName }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = () => {
    // TODO: Implement sign out functionality
    console.log("Signing out...");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="font-display text-2xl font-bold text-foreground">
              Looped
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!isAuthenticated ? (
              <>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
                <AuthDialog>
                  <Button variant="outline">Sign In</Button>
                </AuthDialog>
                <AuthDialog>
                  <Button className="btn-hero">Start Free</Button>
                </AuthDialog>
              </>
            ) : (
              <>
                <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
                <a href="/progress" className="text-muted-foreground hover:text-foreground transition-colors">
                  Progress
                </a>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    Hey, {userName || "there"}!
                  </span>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {!isAuthenticated ? (
                <>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                  <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </a>
                  <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </a>
                  <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                    <AuthDialog>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </AuthDialog>
                    <AuthDialog>
                      <Button className="btn-hero w-full">Start Free</Button>
                    </AuthDialog>
                  </div>
                </>
              ) : (
                <>
                  <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </a>
                  <a href="/progress" className="text-muted-foreground hover:text-foreground transition-colors">
                    Progress
                  </a>
                  <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;