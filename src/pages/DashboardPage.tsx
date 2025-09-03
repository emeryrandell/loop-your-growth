import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";

const DashboardPage = () => {
  // This would come from your auth context
  const isAuthenticated = true;
  const userName = "Alex";

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={isAuthenticated} userName={userName} />
      <Dashboard />
    </div>
  );
};

export default DashboardPage;