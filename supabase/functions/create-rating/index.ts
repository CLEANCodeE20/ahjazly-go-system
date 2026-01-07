import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateRatingRequest {
    trip_id: number;
    booking_id: number;
    driver_id?: number;
    partner_id: number;
    stars: number;
    service_rating?: number;
    cleanliness_rating?: number;
    punctuality_rating?: number;
    comfort_rating?: number;
    value_for_money_rating?: number;
    comment?: string;
}

serve(async (req) => {
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

        // Get user_id from users table
        const { data: userData, error: userDataError } = await supabaseClient
            .from("users")
            .select("user_id")
            .eq("auth_id", user.id)
            .single();

        if (userDataError || !userData) {
            throw new Error("User not found");
        }

        const userId = userData.user_id;

        // Parse request body
        const body: CreateRatingRequest = await req.json();

        // Validate required fields
        if (!body.trip_id || !body.booking_id || !body.partner_id || !body.stars) {
            throw new Error("Missing required fields");
        }

        // Validate star rating
        if (body.stars < 1 || body.stars > 5) {
            throw new Error("Stars must be between 1 and 5");
        }

        // Validate optional ratings
        const validateRating = (rating?: number, name?: string) => {
            if (rating !== undefined && rating !== null) {
                if (rating < 1 || rating > 5) {
                    throw new Error(`${name || 'Rating'} must be between 1 and 5`);
                }
            }
        };

        validateRating(body.service_rating, "Service rating");
        validateRating(body.cleanliness_rating, "Cleanliness rating");
        validateRating(body.punctuality_rating, "Punctuality rating");
        validateRating(body.comfort_rating, "Comfort rating");
        validateRating(body.value_for_money_rating, "Value for money rating");

        // Call the create_rating function
        const { data: ratingData, error: ratingError } = await supabaseClient.rpc(
            "create_rating",
            {
                p_user_id: userId,
                p_trip_id: body.trip_id,
                p_booking_id: body.booking_id,
                p_driver_id: body.driver_id || null,
                p_partner_id: body.partner_id,
                p_stars: body.stars,
                p_service_rating: body.service_rating || null,
                p_cleanliness_rating: body.cleanliness_rating || null,
                p_punctuality_rating: body.punctuality_rating || null,
                p_comfort_rating: body.comfort_rating || null,
                p_value_for_money_rating: body.value_for_money_rating || null,
                p_comment: body.comment || null,
            }
        );

        if (ratingError) {
            console.error("Rating creation error:", ratingError);
            throw new Error(ratingError.message || "Failed to create rating");
        }

        // Get the created rating details
        const { data: rating, error: fetchError } = await supabaseClient
            .from("ratings")
            .select("*")
            .eq("rating_id", ratingData)
            .single();

        if (fetchError) {
            console.error("Fetch rating error:", fetchError);
            throw new Error("Rating created but failed to fetch details");
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: rating,
                message: "Rating created successfully",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 201,
            }
        );
    } catch (error) {
        console.error("Error in create-rating function:", error);
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
