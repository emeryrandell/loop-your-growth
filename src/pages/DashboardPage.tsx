import Navigation from "@/components/Navigation";
import NewDashboard from "@/components/NewDashboard";
import { useTrainer } from "@/hooks/useTrainer";
import { useAuth } from "@/contexts/AuthContext";

const DashboardPage = () => {
  const { canAccessPaidFeatures } = useTrainer();
  const { user, loading } = useAuth();

  const navigate = useNavigate();
// ...
<Button className="btn-hero" onClick={() => navigate("/calendar")}>
  <CalendarDays className="h-4 w-4 mr-2" />
  Calendar & To-Do
</Button>

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