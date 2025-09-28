import Navigation from "@/components/Navigation";
import NewDashboard from "@/components/NewDashboard";

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