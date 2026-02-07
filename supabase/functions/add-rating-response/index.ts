import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateResponseRequest {
    rating_id: number;
    response_text: string;
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

        // Get partner_id from users table
        const { data: userData, error: userDataError } = await supabaseClient
            .from("users")
            .select("partner_id, user_type")
            .eq("auth_id", user.id)
            .single();

        if (userDataError || !userData) {
            throw new Error("User not found");
        }

        // Check if user is a partner or employee
        if (!userData.partner_id || !['partner', 'employee'].includes(userData.user_type)) {
            throw new Error("Only partners and employees can respond to ratings");
        }

        const userId = user.id; // Use auth_id
        const partnerId = userData.partner_id;

        // Parse request body
        const body: CreateResponseRequest = await req.json();

        // Validate required fields
        if (!body.rating_id || !body.response_text) {
            throw new Error("Missing required fields");
        }

        // Validate response text length
        if (body.response_text.trim().length < 10) {
            throw new Error("Response must be at least 10 characters");
        }

        if (body.response_text.length > 1000) {
            throw new Error("Response must not exceed 1000 characters");
        }

        // Verify the rating belongs to this partner
        const { data: rating, error: ratingError } = await supabaseClient
            .from("ratings")
            .select("partner_id, rating_id")
            .eq("rating_id", body.rating_id)
            .single();

        if (ratingError || !rating) {
            throw new Error("Rating not found");
        }

        if (rating.partner_id !== partnerId) {
            throw new Error("You can only respond to ratings for your company");
        }

        // Check if response already exists
        const { data: existingResponse } = await supabaseClient
            .from("rating_responses")
            .select("response_id")
            .eq("rating_id", body.rating_id)
            .single();

        if (existingResponse) {
            throw new Error("A response already exists for this rating");
        }

        // Create the response
        const { data: response, error: createError } = await supabaseClient
            .from("rating_responses")
            .insert({
                rating_id: body.rating_id,
                partner_id: partnerId,
                auth_id: userId, // Updated to auth_id
                response_text: body.response_text.trim(),
            })
            .select()
            .single();

        if (createError) {
            console.error("Response creation error:", createError);
            throw new Error(createError.message || "Failed to create response");
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: response,
                message: "Response created successfully",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 201,
            }
        );
    } catch (error) {
        console.error("Error in add-rating-response function:", error);
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
