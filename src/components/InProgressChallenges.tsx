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

  if (inProgressChallenges.length === 0) {
    return (
      <Card className="card-soft">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">No pending challenges yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create one or ask your coach!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Your Queue</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 p-4 pt-0">
          {inProgressChallenges.slice(0, 3).map((challenge) => (
            <div key={challenge.id} className="border border-border/30 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">
                    {challenge.custom_title || 'Challenge'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {challenge.custom_description || 'Custom challenge'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {challenge.custom_category || 'mindset'}
                  </Badge>
                  {challenge.custom_time_minutes && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {challenge.custom_time_minutes}m
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartChallenge(challenge.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteChallenge(challenge.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InProgressChallenges;