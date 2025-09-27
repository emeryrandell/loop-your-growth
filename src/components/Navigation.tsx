import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
  isAuthenticated?: boolean;
  userName?: string;
}

const Navigation = ({ isAuthenticated = false, userName }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-warm rounded-2xl flex items-center justify-center shadow-warm group-hover:shadow-lg transition-all duration-300">
                <span className="text-accent-foreground font-bold text-lg">D</span>
              </div>
              <span className="font-display font-bold text-2xl text-foreground">Daily Challenges</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!isAuthenticated ? (
              <>
                <Link to="/features" className="text-foreground hover:text-primary transition-colors">Features</Link>
                <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">Pricing</Link>
                <Link to="/faq" className="text-foreground hover:text-primary transition-colors">FAQ</Link>
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button className="btn-hero" onClick={() => navigate("/auth")}>Get Started</Button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/progress" className="text-foreground hover:text-primary transition-colors">Progress</Link>
                <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
                <span className="text-muted-foreground">Welcome, {userName}</span>
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
                  <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Features
                  </Link>
                  <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Pricing
                  </Link>
                  <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    FAQ
                  </Link>
                  <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                    <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}>Sign In</Button>
                    <Button className="btn-hero w-full" onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}>Get Started</Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/progress" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Progress
                  </Link>
                  <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
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