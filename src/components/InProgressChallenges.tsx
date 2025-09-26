import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const InProgressChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inProgressChallenges = [], isLoading } = useQuery({
    queryKey: ['in-progress-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const handleStartChallenge = async (challengeId: string) => {
    console.log('Starting challenge:', challengeId);
    
    try {
      const { error } = await supabase
        .from('user_challenges')
        .update({ status: 'in_progress' })
        .eq('id', challengeId);

      if (error) {
        console.error('Challenge start error:', error);
        toast({
          title: "Error",
          description: "Failed to start challenge. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log('Challenge started successfully');
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['in-progress-challenges'] });
        queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
        
        toast({
          title: "Challenge started!",
          description: "Let's do this!"
        });
      }
    } catch (error) {
      console.error('Unexpected error starting challenge:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('user_challenges')
      .delete()
      .eq('id', challengeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete challenge. Please try again.",
        variant: "destructive"
      });
    } else {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['in-progress-challenges'] });
      
      toast({
        title: "Challenge removed",
        description: "Challenge deleted from your queue."
      });
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <Card className="card-soft">
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Queue Empty</p>
        <p className="text-xs text-muted-foreground mt-1">All challenges shown above</p>
      </CardContent>
    </Card>
  );
};

export default InProgressChallenges;