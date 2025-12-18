import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fitnessLevel, goals, daysPerWeek, focusAreas, restrictions } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating workout plan for:", { fitnessLevel, goals, daysPerWeek, focusAreas });

    const systemPrompt = `You are an expert fitness coach and workout planner. Create personalized, science-based workout plans that are safe, effective, and achievable.

Always structure your response as a complete weekly workout plan with:
1. A brief introduction addressing the user's goals
2. Detailed daily workouts with exercise names, sets, reps, and rest periods
3. Tips for progression and recovery
4. Warm-up and cool-down recommendations

Format the workout days clearly with headers. Be specific with exercise instructions.
Use emojis sparingly to make it engaging but keep it professional.`;

    const userPrompt = `Create a personalized ${daysPerWeek}-day weekly workout plan for someone with the following profile:

**Fitness Level:** ${fitnessLevel}
**Primary Goals:** ${goals}
**Focus Areas:** ${focusAreas.join(", ")}
${restrictions ? `**Restrictions/Considerations:** ${restrictions}` : ""}

Please provide a detailed weekly workout plan with specific exercises, sets, reps, and rest periods for each training day. Include warm-up and cool-down recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const workoutPlan = data.choices?.[0]?.message?.content;

    if (!workoutPlan) {
      throw new Error("No workout plan generated");
    }

    console.log("Workout plan generated successfully");

    return new Response(JSON.stringify({ workoutPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating workout plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate workout plan";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
