import Navigation from "@/components/Navigation";
import NewDashboard from "@/components/NewDashboard";
import { useTrainer } from "@/hooks/useTrainer";

const DashboardPage = () => {
  const { canAccessPaidFeatures } = useTrainer();

  if (!canAccessPaidFeatures) {
    // Redirect to upgrade page or demo
    window.location.href = '/demo';
    return null;
  }

  return <NewDashboard />;
};

export default DashboardPage;