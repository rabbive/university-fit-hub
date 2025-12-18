import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student user ID
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", "Test Student")
      .single();

    const studentId = studentProfile?.id;

    if (studentId) {
      // Reset student profile stats
      await supabase
        .from("profiles")
        .update({
          total_points: 1850,
          current_streak: 7,
        })
        .eq("id", studentId);

      // Clear and re-seed workouts for student
      await supabase.from("workouts").delete().eq("user_id", studentId);

      const workoutData = [];
      const workoutNames = [
        "Upper Body Power", "Leg Day", "Full Body HIIT", "Chest & Triceps", 
        "Back & Biceps", "Shoulder Shred", "Core Crusher", "Cardio Blast",
        "Strength Foundation", "Athletic Performance", "Push Day", "Pull Day",
        "Lower Body Strength", "Functional Training", "Endurance Builder"
      ];

      for (let i = 0; i < 25; i++) {
        const daysAgo = Math.floor(i / 2) + 1;
        workoutData.push({
          user_id: studentId,
          name: workoutNames[i % workoutNames.length],
          duration_minutes: 30 + Math.floor(Math.random() * 60),
          points_earned: 10 + Math.floor(Math.random() * 30),
          completed_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          notes: i % 3 === 0 ? "Great workout!" : null,
        });
      }

      const { data: workouts } = await supabase
        .from("workouts")
        .insert(workoutData)
        .select("id");

      // Add exercises to workouts
      if (workouts) {
        const exercises = [
          "Bench Press", "Squats", "Deadlift", "Pull-ups", "Shoulder Press",
          "Bicep Curls", "Tricep Dips", "Lunges", "Plank", "Burpees",
          "Rows", "Leg Press", "Calf Raises", "Lat Pulldown", "Push-ups"
        ];

        const exerciseData = [];
        let prCount = 0;

        for (const workout of workouts) {
          const numExercises = 3 + Math.floor(Math.random() * 4);
          for (let j = 0; j < numExercises; j++) {
            const isPR = prCount < 6 && Math.random() > 0.8;
            if (isPR) prCount++;
            
            exerciseData.push({
              workout_id: workout.id,
              exercise_name: exercises[Math.floor(Math.random() * exercises.length)],
              sets: 3 + Math.floor(Math.random() * 2),
              reps: 8 + Math.floor(Math.random() * 8),
              weight: 20 + Math.floor(Math.random() * 80),
              is_pr: isPR,
            });
          }
        }

        await supabase.from("workout_exercises").insert(exerciseData);
      }

      // Reset challenge participations
      await supabase.from("challenge_participants").delete().eq("user_id", studentId);
      
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id")
        .eq("is_active", true)
        .limit(4);

      if (challenges) {
        const participations = challenges.map((c, i) => ({
          user_id: studentId,
          challenge_id: c.id,
          progress: [12, 7, 8, 3][i] || 5,
          completed: false,
        }));
        await supabase.from("challenge_participants").insert(participations);
      }

      // Reset buddy preferences
      await supabase.from("buddy_preferences").delete().eq("user_id", studentId);
      await supabase.from("buddy_preferences").insert({
        user_id: studentId,
        looking_for_buddy: true,
        workout_types: ["strength", "cardio", "crossfit"],
        preferred_times: ["morning", "evening"],
        preferred_days: [1, 3, 5],
        bio: "Looking for a motivated workout partner! I usually train in the mornings or after work.",
      });

      // Reset gym check-in
      await supabase.from("gym_occupancy").delete().eq("user_id", studentId);
      await supabase.from("gym_occupancy").insert({
        user_id: studentId,
        check_in_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Demo data reset successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error resetting demo data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
