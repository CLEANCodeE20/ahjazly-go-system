import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarkHelpfulRequest {
    rating_id: number;
    is_helpful: boolean;
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
        const body: MarkHelpfulRequest = await req.json();

        // Validate required fields
        if (!body.rating_id || body.is_helpful === undefined) {
            throw new Error("Missing required fields");
        }

        // Check if rating exists
        const { data: rating, error: ratingError } = await supabaseClient
            .from("ratings")
            .select("rating_id")
            .eq("rating_id", body.rating_id)
            .eq("is_visible", true)
            .single();

        if (ratingError || !rating) {
            throw new Error("Rating not found");
        }

        // Check if user already marked this rating
        const { data: existing } = await supabaseClient
            .from("rating_helpfulness")
            .select("id, is_helpful")
            .eq("rating_id", body.rating_id)
            .eq("auth_id", userId) // Updated to auth_id (using existing var which is now auth_id)
            .single();

        let result;

        if (existing) {
            // Update existing vote
            if (existing.is_helpful === body.is_helpful) {
                // Same vote - delete it (toggle off)
                const { error: deleteError } = await supabaseClient
                    .from("rating_helpfulness")
                    .delete()
                    .eq("id", existing.id);

                if (deleteError) {
                    throw new Error("Failed to remove vote");
                }

                result = { action: "removed" };
            } else {
                // Different vote - update it
                const { data: updated, error: updateError } = await supabaseClient
                    .from("rating_helpfulness")
                    .update({ is_helpful: body.is_helpful })
                    .eq("id", existing.id)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error("Failed to update vote");
                }

                result = { action: "updated", data: updated };
            }
        } else {
            // Create new vote
            const { data: created, error: createError } = await supabaseClient
                .from("rating_helpfulness")
                .insert({
                    rating_id: body.rating_id,
                    auth_id: userId, // Updated to auth_id
                    is_helpful: body.is_helpful,
                })
                .select()
                .single();

            if (createError) {
                throw new Error("Failed to create vote");
            }

            result = { action: "created", data: created };
        }

        // Get updated counts
        const { data: updatedRating } = await supabaseClient
            .from("ratings")
            .select("helpful_count, not_helpful_count")
            .eq("rating_id", body.rating_id)
            .single();

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    ...result,
                    helpful_count: updatedRating?.helpful_count || 0,
                    not_helpful_count: updatedRating?.not_helpful_count || 0,
                },
                message: "Vote recorded successfully",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        console.error("Error in mark-rating-helpful function:", error);
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
