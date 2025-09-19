import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoRequest {
  categories: string[];
  timeMinutes: number;
  constraints: string[];
  kidMode?: boolean;
  goal?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { categories, timeMinutes, constraints, kidMode, goal }: DemoRequest = await req.json();

    console.log('Demo challenge request:', { categories, timeMinutes, constraints, kidMode });

    // Demo challenge selection logic
    let selectedCategory = 'mindset'; // Default
    if (categories && categories.length > 0) {
      // Prefer Energy/Mindset for demo impact
      if (categories.includes('energy') || categories.includes('movement')) {
        selectedCategory = 'energy';
      } else if (categories.includes('mindset')) {
        selectedCategory = 'mindset';
      } else {
        selectedCategory = categories[0].toLowerCase();
      }
    }

    // Query challenges with filters
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('category', selectedCategory)
      .eq('estimated_minutes', timeMinutes)
      .lte('difficulty', kidMode ? '2' : '3') // Easier for kids
      .limit(5);

    // Apply constraint filters
    if (constraints.includes('no-equipment')) {
      query = query.not('description', 'ilike', '%equipment%');
    }
    if (constraints.includes('apartment-friendly')) {
      query = query.not('description', 'ilike', '%jump%');
    }

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Challenge query error:', error);
      throw error;
    }

    // Select a random challenge from results, or create a fallback
    let selectedChallenge;
    if (challenges && challenges.length > 0) {
      const randomIndex = Math.floor(Math.random() * challenges.length);
      selectedChallenge = challenges[randomIndex];
    } else {
      // Fallback demo challenge
      selectedChallenge = {
        id: 'demo-fallback',
        category: selectedCategory,
        title: selectedCategory === 'mindset' ? 'Three Gratitudes' : 'Two-Minute Movement',
        description: selectedCategory === 'mindset' 
          ? 'Write down three things you\'re grateful for today. Notice how this simple practice shifts your perspective.'
          : 'Set a timer and move your body for two minutes. This could be stretching, dancing, or walking around your space.',
        benefit: selectedCategory === 'mindset'
          ? 'Gratitude rewires your brain to notice positive moments throughout your day.'
          : 'Short movement breaks boost energy and improve focus for the rest of your day.',
        difficulty: 1,
        estimated_minutes: timeMinutes,
        day_number: 1
      };
    }

    // Add demo-specific messaging
    const demoChallenge = {
      ...selectedChallenge,
      demoMessage: `Perfect! Based on your interests in ${selectedCategory}, here's your personalized Day 1 challenge.`,
      trainerNote: kidMode 
        ? `Great choice! This is perfect for building a daily habit. Tomorrow I'd suggest something similar but with a tiny twist.`
        : `Nice work! I can see ${selectedCategory} resonates with you. Tomorrow I'll build on this momentum with something complementary.`
    };

    console.log('Selected demo challenge:', demoChallenge.id);

    return new Response(JSON.stringify({ challenge: demoChallenge }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Demo challenge error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});