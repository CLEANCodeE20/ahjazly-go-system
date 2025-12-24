import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                </div>
                <p className="text-muted-foreground animate-pulse text-sm font-medium">جاري التحميل...</p>
            </div>
        </div>
    );
};
