import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "class_reminder" | "achievement" | "buddy_request";
  to_email: string;
  to_name: string;
  data: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to_email, to_name, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to_email}`);

    let subject = "";
    let html = "";

    switch (type) {
      case "class_reminder":
        subject = `Reminder: ${data.class_name} starts soon!`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3B82F6;">Class Reminder 📅</h1>
            <p>Hi ${to_name},</p>
            <p>This is a friendly reminder that your fitness class is coming up!</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #1F2937;">${data.class_name}</h2>
              <p style="margin: 5px 0; color: #6B7280;">📍 ${data.location || 'TBD'}</p>
              <p style="margin: 5px 0; color: #6B7280;">🕐 ${data.time}</p>
              <p style="margin: 5px 0; color: #6B7280;">👤 Instructor: ${data.instructor || 'TBD'}</p>
            </div>
            <p>Don't forget to bring water and arrive a few minutes early!</p>
            <p style="color: #6B7280; font-size: 14px;">See you there! 💪</p>
          </div>
        `;
        break;

      case "achievement":
        subject = `🏆 You earned a new achievement: ${data.achievement_name}!`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #F59E0B;">Achievement Unlocked! 🏆</h1>
            <p>Hi ${to_name},</p>
            <p>Congratulations! You've earned a new achievement!</p>
            <div style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${data.icon || '🏆'}</div>
              <h2 style="margin: 0 0 10px 0; color: #92400E;">${data.achievement_name}</h2>
              <p style="margin: 0; color: #B45309;">${data.description}</p>
              <p style="margin: 10px 0 0 0; color: #D97706; font-weight: bold;">+${data.points} points</p>
            </div>
            <p>Keep up the great work!</p>
          </div>
        `;
        break;

      case "buddy_request":
        subject = `${data.requester_name} wants to be your workout buddy!`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">New Buddy Request! 🤝</h1>
            <p>Hi ${to_name},</p>
            <p>Great news! Someone wants to work out with you!</p>
            <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #065F46;">${data.requester_name}</h2>
              <p style="margin: 5px 0; color: #047857;">Fitness Level: ${data.fitness_level || 'Not specified'}</p>
              ${data.message ? `<p style="margin: 10px 0 0 0; color: #6B7280; font-style: italic;">"${data.message}"</p>` : ''}
            </div>
            <p>Log in to FitClub to accept or decline this request!</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "FitClub <onboarding@resend.dev>",
      to: [to_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
