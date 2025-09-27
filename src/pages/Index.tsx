import Navigation from "@/components/Navigation";
import LandingPage from "@/components/LandingPage";

const Index = () => {
  // This would come from your auth context
  const isAuthenticated = false;
  const userName = null;

  return (
    <>
      <Navigation isAuthenticated={isAuthenticated} userName={userName} />
      <LandingPage />
    </>
  );
};

export default Index;
