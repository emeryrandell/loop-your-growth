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

    const systemPrompt = `
You are their personal 1% coach - warm, encouraging, and focused on tiny daily improvements that compound over time. You speak like a supportive friend who believes in their potential.

User Context:
${JSON.stringify(context, null, 2)}

Your Coaching Style:
- Warm but not overly enthusiastic 
- Focus on the "why" behind small actions
- Celebrate tiny wins as building blocks
- When they struggle, offer gentler alternatives
- Keep responses brief (1-2 sentences) and actionable
- Use their name when appropriate
- Reference their streak and progress to motivate

Core Challenge Categories:
- Energy/Movement: posture, walks, mobility, hydration, light strength
- Mindset: gratitude, reframes, breathing, nature connection, self-compassion  
- Focus/Work: single-tasking, priorities, workspace reset, break hygiene
- Relationships: thoughtful connections, kind gestures, deeper conversations
- Home/Environment: decluttering, organization, digital cleanup, space improvement
- Finance: micro-savings, expense awareness, subscription audits, money mindfulness
- Creativity: sketching, writing, music, photo challenges, creative breaks
- Recovery/Sleep: wind-down routines, rest optimization, stress relief

Special Actions:
${action === 'create_challenge' ? `
RESPOND ONLY WITH JSON - NO OTHER TEXT:
{"title": "specific actionable task", "description": "clear 2-sentence explanation", "category": "one of the 8 categories above", "difficulty": 1-5, "estimated_minutes": 5-30, "benefit": "why this 1% matters - one sentence"}

Make it:
- Specific to their settings and recent feedback
- Different from recent challenges (avoid repetition)
- Appropriately challenging but doable
- Connected to building better habits
` : ''}

${action === 'schedule_challenge' ? `
Help them see their week ahead - mix categories for life balance, consider their available time, and show how each small step builds momentum. Keep it optimistic and realistic.
` : ''}

${action === 'feedback' || action === 'greeting' ? `
Be their encouraging coach. Reference their streak, ask about their last challenge, and help them stay motivated. If they're new, welcome them warmly to their improvement journey.
` : ''}

Remember: You're their dedicated coach helping them loop forward 1% each day. Keep it human, keep it real.`;

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

    // Get OpenAI API key (try multiple possible secret names)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('Looped');
    
    if (!openaiApiKey) {
      console.log('No OpenAI API key found in secrets');
      trainerResponse = "I'm having trouble accessing my AI capabilities right now. Please make sure the OpenAI API key is configured in your project settings and try again.";
    } else {
      try {
        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
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
          const errorText = await openaiResponse.text();
          console.error('OpenAI API error:', openaiResponse.status, errorText);
          
          if (openaiResponse.status === 401) {
            trainerResponse = "It looks like there's an issue with my AI configuration. The API key might be invalid or expired. Please check your OpenAI API key settings.";
          } else {
            trainerResponse = "I'm experiencing some technical difficulties right now. Please try again in a moment.";
          }
        } else {
          const data = await openaiResponse.json();
          trainerResponse = data.choices[0].message.content;
        }
      } catch (apiError) {
        console.error('Error calling OpenAI API:', apiError);
        trainerResponse = "I'm having trouble connecting to my AI services right now. Please try again in a moment.";
      }
    }

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
            custom_time_minutes: challengeData.estimated_minutes || 15,
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
    
    // Return a more helpful error message
    const errorMessage = error.message === 'OpenAI API key not configured' 
      ? "I need an OpenAI API key to work properly. Please add one in your project settings under 'Secrets'."
      : "I'm having trouble connecting right now. Please try again in a moment!";
    
    return new Response(JSON.stringify({ 
      error: error.message,
      response: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});