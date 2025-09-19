import { Calendar, Filter, Clock, Trophy, CheckCircle, XCircle, Pause, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const HistoryPage = () => {
  const { user } = useAuth();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Get challenge history (excluding notes)
  const { data: challengeHistory = [], isLoading } = useQuery({
    queryKey: ['challenge-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', user.id)
        .neq('status', 'note') // Exclude notes from challenge history
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get notes separately
  const { data: notes = [] } = useQuery({
    queryKey: ['user-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'note')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      energy: 'bg-success',
      mindset: 'bg-accent',
      focus: 'bg-secondary',
      relationships: 'bg-primary',
      home: 'bg-success',
      finance: 'bg-secondary',
      creativity: 'bg-accent',
      recovery: 'bg-primary',
    };
    return colors[category as keyof typeof colors] || 'bg-muted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'snoozed':
        return <Pause className="h-5 w-5 text-warning" />;
      case 'skipped':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'snoozed':
        return 'Snoozed';
      case 'skipped':
        return 'Skipped';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const filteredHistory = filterCategory 
    ? challengeHistory.filter(item => {
        // For custom challenges, use custom_category; for regular challenges, use challenges.category
        const category = item.is_custom ? item.custom_category : item.challenges?.category;
        return category === filterCategory;
      })
    : challengeHistory;

  const categories = ['energy', 'mindset', 'focus', 'relationships', 'home', 'finance', 'creativity', 'recovery'];

  const stats = {
    total: challengeHistory.length,
    completed: challengeHistory.filter(item => item.status === 'completed').length,
    snoozed: challengeHistory.filter(item => item.status === 'snoozed').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
      
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Challenge History
            </h1>
            <p className="text-muted-foreground">
              Track your growth journey and reflect on your progress
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters & Stats */}
            <div className="space-y-6">
              {/* Stats Overview */}
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success mb-1">
                      {completionRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Challenges</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-medium text-success">{stats.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Snoozed</span>
                      <span className="font-medium text-warning">{stats.snoozed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Filter */}
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filter by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={filterCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(null)}
                    className="w-full justify-start"
                  >
                    All Categories
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={filterCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory(category)}
                      className="w-full justify-start capitalize"
                    >
                      <div className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(category)}`}></div>
                      {category}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Challenge History */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading your history...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <Card className="card-feature text-center py-12">
                    <CardContent>
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
                      <p className="text-muted-foreground">
                        {filterCategory ? `No challenges in the ${filterCategory} category yet.` : 'Start your first challenge to see your history here!'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredHistory.map((item) => (
                    <Card key={item.id} className="card-feature hover:shadow-md transition-shadow">
                      <div className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor(item.is_custom ? item.custom_category || '' : item.challenges?.category || '')}`}></div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              {getStatusIcon(item.status)}
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="capitalize">
                                  {item.is_custom ? (item.custom_category || 'Custom') : (item.challenges?.category || 'Unknown')}
                                </Badge>
                                <Badge variant="secondary">
                                  Level {item.is_custom ? '1' : (item.challenges?.difficulty || '1')}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {item.is_custom ? (item.custom_time_minutes || 15) : (item.challenges?.estimated_minutes || 0)} min
                                </span>
                              </div>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-2">
                              {item.is_custom ? (item.custom_title || 'Custom Challenge') : (item.challenges?.title || 'Unknown Challenge')}
                            </h3>
                            
                            <p className="text-muted-foreground mb-3 text-sm">
                              {item.is_custom ? (item.custom_description || 'No description available') : (item.challenges?.description || 'No description available')}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>
                                {item.completion_date 
                                  ? new Date(item.completion_date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric'
                                    })
                                  : new Date(item.created_at).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric'
                                    })
                                }
                              </span>
                              <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                                {getStatusText(item.status)}
                              </Badge>
                            </div>
                            
                            {item.notes && (
                              <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Your note:</strong> {item.notes}
                                </p>
                              </div>
                            )}
                            
                            {item.feedback && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Feedback: {item.feedback.replace('_', ' ')}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Notes Section */}
              {notes.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <StickyNote className="h-5 w-5 mr-2" />
                    Your Notes
                  </h2>
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <Card key={note.id} className="card-feature">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  <StickyNote className="h-3 w-3 mr-1" />
                                  Note
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(note.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {note.custom_description || note.notes}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;