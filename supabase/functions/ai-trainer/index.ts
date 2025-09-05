import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, action } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get user's trainer settings and memory
    const [settingsResult, memoryResult, messagesResult] = await Promise.all([
      supabaseClient.from('trainer_settings').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('trainer_memory').select('*').eq('user_id', user.id),
      supabaseClient.from('trainer_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    ]);

    const settings = settingsResult.data;
    const memory = memoryResult.data || [];
    const recentMessages = messagesResult.data || [];

    // Build context for AI
    const context = {
      settings,
      memory: memory.reduce((acc: any, item: any) => {
        acc[item.key] = item.value;
        return acc;
      }, {}),
      recentMessages: recentMessages.reverse()
    };

    let systemPrompt = `You are a personal 1% improvement trainer. Your goal is to help users get 1% better every day through small, achievable challenges.

User Context:
- Focus areas: ${settings?.focus_areas?.join(', ') || 'General'}
- Time budget: ${settings?.time_budget || 15} minutes
- Difficulty preference: ${settings?.difficulty_preference || 3}/5
- Goals: ${settings?.goals || 'Not specified'}
- Constraints: ${settings?.constraints || 'None'}

User Memory: ${JSON.stringify(context.memory, null, 2)}

Recent conversation: ${context.recentMessages.map((m: any) => `${m.message_type}: ${m.content}`).join('\n')}

Guidelines:
- Keep responses encouraging, concise, and actionable
- Suggest specific 5-30 minute challenges when asked
- Remember user preferences and adapt over time
- Be conversational but focused on improvement
- When creating challenges, specify: title, description, category, time estimate, and why it helps`;

    // Save user message
    if (message) {
      await supabaseClient.from('trainer_messages').insert({
        user_id: user.id,
        message_type: 'user',
        content: message
      });
    }

    let trainerResponse = '';

    // Handle different actions
    if (action === 'create_challenge') {
      systemPrompt += '\n\nThe user wants you to create a custom challenge for them. Respond with a JSON object containing: {"title": "...", "description": "...", "category": "...", "time_minutes": number, "difficulty": 1-5}';
    } else if (action === 'schedule_challenge') {
      systemPrompt += '\n\nThe user wants to schedule challenges. Help them plan their upcoming challenges based on their preferences and goals.';
    } else if (action === 'feedback') {
      systemPrompt += '\n\nThe user is providing feedback on a completed challenge. Use this to update their preferences and provide encouragement.';
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('looped')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message || 'Hello!' }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const data = await openaiResponse.json();
    trainerResponse = data.choices[0].message.content;

    // Save trainer response
    await supabaseClient.from('trainer_messages').insert({
      user_id: user.id,
      message_type: 'trainer',
      content: trainerResponse
    });

    // If this was a create_challenge action, try to parse and save the challenge
    if (action === 'create_challenge') {
      try {
        const challengeData = JSON.parse(trainerResponse);
        if (challengeData.title && challengeData.description) {
          await supabaseClient.from('user_challenges').insert({
            user_id: user.id,
            is_custom: true,
            custom_title: challengeData.title,
            custom_description: challengeData.description,
            custom_category: challengeData.category || 'Mindset',
            custom_time_minutes: challengeData.time_minutes || 15,
            created_by: 'trainer',
            scheduled_date: new Date().toISOString().split('T')[0],
            status: 'pending'
          });
        }
      } catch (e) {
        console.log('Could not parse challenge JSON, treating as regular message');
      }
    }

    // Update trainer memory based on conversation
    if (message && message.length > 0) {
      const memoryKey = `conversation_${Date.now()}`;
      await supabaseClient.from('trainer_memory').upsert({
        user_id: user.id,
        memory_type: 'pattern',
        key: memoryKey,
        value: `User said: ${message}. Context: ${action || 'general'}`
      });
    }

    return new Response(JSON.stringify({ 
      response: trainerResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-trainer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again in a moment!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});