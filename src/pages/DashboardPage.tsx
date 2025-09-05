import Navigation from "@/components/Navigation";
import NewDashboard from "@/components/NewDashboard";
import { useTrainer } from "@/hooks/useTrainer";
import { useAuth } from "@/contexts/AuthContext";

const DashboardPage = () => {
  const { canAccessPaidFeatures } = useTrainer();
  const { user, loading } = useAuth();

  if (!loading && !user) {
    window.location.href = '/auth';
    return null;
  }

  if (!canAccessPaidFeatures) {
    // Redirect to upgrade page or demo
    window.location.href = '/demo';
    return null;
  }

  return <NewDashboard />;
};

export default DashboardPage;