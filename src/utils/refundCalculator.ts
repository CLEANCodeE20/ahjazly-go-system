import { CancelPolicyRule } from "@/hooks/useCancellationPolicies";

interface RefundCalculationResult {
    refundAmount: number;
    cancellationFee: number;
    refundPercentage: number;
    appliedRuleId: number | null;
}

/**
 * Calculates the refund amount and cancellation fee based on the policy rules and time before departure.
 * 
 * @param basePrice The original price of the booking.
 * @param departureTime The scheduled departure time of the trip.
 * @param rules The list of rules for the applicable cancellation policy.
 * @param cancellationTime The time when the cancellation is requested (defaults to now).
 * @returns RefundCalculationResult
 */
export const calculateRefund = (
    basePrice: number,
    departureTime: string | Date,
    rules: CancelPolicyRule[],
    cancellationTime: Date = new Date()
): RefundCalculationResult => {
    const depTime = new Date(departureTime);
    const diffInMs = depTime.getTime() - cancellationTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // If the trip has already departed, no refund (unless rules specify otherwise, but usually 0)
    if (diffInHours <= 0) {
        return {
            refundAmount: 0,
            cancellationFee: basePrice,
            refundPercentage: 0,
            appliedRuleId: null
        };
    }

    // Find the matching rule based on hours before departure
    // Rules are usually ordered by display_order or hours
    // We look for a rule where diffInHours is between min and max
    const matchingRule = rules.find(rule => {
        const min = rule.min_hours_before_departure ?? 0;
        const max = rule.max_hours_before_departure ?? Number.MAX_SAFE_INTEGER;
        return diffInHours >= min && diffInHours <= max;
    });

    if (!matchingRule) {
        // Default: Full refund if no rule matches (or maybe 0 refund? usually full if not specified)
        return {
            refundAmount: basePrice,
            cancellationFee: 0,
            refundPercentage: 100,
            appliedRuleId: null
        };
    }

    const refundPercentage = matchingRule.refund_percentage;
    const fixedFee = matchingRule.cancellation_fee || 0;

    const refundAmount = Math.max(0, (basePrice * (refundPercentage / 100)) - fixedFee);
    const cancellationFee = basePrice - refundAmount;

    return {
        refundAmount,
        cancellationFee,
        refundPercentage,
        appliedRuleId: matchingRule.rule_id
    };
};
