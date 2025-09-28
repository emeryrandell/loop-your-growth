import Navigation from "@/components/Navigation";
import NewDashboard from "@/components/NewDashboard";
import { useTrainer } from "@/hooks/useTrainer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

const DashboardPage = () => {
  const { canAccessPaidFeatures } = useTrainer();
  const { user, loading } = useAuth();

  if (!loading && !user) {
    window.location.href = '/auth';
    return null;
  }

 if (!canAccessPaidFeatures) {
   // Redirect to pricing/upgrade
   window.location.href = '/pricing';
   return null;
 }
  
  return <NewDashboard />;
};

export default DashboardPage;