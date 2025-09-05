import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  message_type: 'user' | 'trainer';
  content: string;
  created_at: string;
}

const AITrainerChat = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversation history
  const { data: messages = [] } = useQuery({
    queryKey: ['trainer-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('trainer_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, action }: { message: string; action?: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-trainer', {
        body: { message, action }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-messages'] });
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
      setMessage("");
      setIsLoading(false);
    },
    onError: (error: any) => {
      console.error('AI Trainer error:', error);
      toast.error("Couldn't send message. Please check if OpenAI API key is configured and try again.");
      setIsLoading(false);
    }
  });

  const handleSendMessage = async (action?: string) => {
    if ((!message.trim() && !action) || isLoading) return;
    
    setIsLoading(true);
    sendMessageMutation.mutate({ message: message.trim(), action });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-greet new users
  useEffect(() => {
    if (user && messages.length === 0) {
      setTimeout(() => {
        sendMessageMutation.mutate({ 
          message: "Hello! I'm ready to start my 1% improvement journey.",
          action: "greeting"
        });
      }, 1000);
    }
  }, [user, messages.length]);

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Your AI Trainer</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal 1% improvement coach
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.message_type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.message_type === 'trainer' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.message_type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.message_type === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('create_challenge')}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Create Challenge
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('schedule_challenge')}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Calendar className="h-3 w-3" />
            Plan Week
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your trainer anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={isLoading || !message.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AITrainerChat;