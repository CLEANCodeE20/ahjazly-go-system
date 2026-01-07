
import { Skeleton } from "@/components/ui/skeleton";

export function TripsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Route & Icon */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 w-full lg:w-auto mt-4 lg:mt-0">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="flex flex-col items-center gap-2">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>

                        {/* Action Placeholder */}
                        <div className="hidden lg:flex items-center">
                            <Skeleton className="w-8 h-8 rounded-md" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
