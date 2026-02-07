import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRatingRequest {
    rating_id: number;
    reason: string;
    description?: string;
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        );

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        // User is authenticated, use user.id (auth_id)
        const userId = user.id;

        // Parse request body
        const body: ReportRatingRequest = await req.json();

        // Validate required fields
        if (!body.rating_id || !body.reason) {
            throw new Error("Missing required fields");
        }

        // Validate reason
        const validReasons = [
            "inappropriate",
            "spam",
            "offensive",
            "fake",
            "misleading",
            "other",
        ];

        if (!validReasons.includes(body.reason)) {
            throw new Error("Invalid reason");
        }

        // Check if rating exists
        const { data: rating, error: ratingError } = await supabaseClient
            .from("ratings")
            .select("rating_id")
            .eq("rating_id", body.rating_id)
            .single();

        if (ratingError || !rating) {
            throw new Error("Rating not found");
        }

        // Check if user already reported this rating
        const { data: existing } = await supabaseClient
            .from("rating_reports")
            .select("report_id")
            .eq("rating_id", body.rating_id)
            .eq("auth_id", user.id) // Updated to auth_id
            .single();

        if (existing) {
            throw new Error("You have already reported this rating");
        }

        // Create the report
        const { data: report, error: createError } = await supabaseClient
            .from("rating_reports")
            .insert({
                rating_id: body.rating_id,
                auth_id: user.id, // Updated to auth_id
                reason: body.reason,
                description: body.description || null,
                status: "pending",
            })
            .select()
            .single();

        if (createError) {
            console.error("Report creation error:", createError);
            throw new Error(createError.message || "Failed to create report");
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: report,
                message: "Report submitted successfully. Our team will review it shortly.",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 201,
            }
        );
    } catch (error) {
        console.error("Error in report-rating function:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Internal server error",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: error.message === "Unauthorized" ? 401 : 400,
            }
        );
    }
});
