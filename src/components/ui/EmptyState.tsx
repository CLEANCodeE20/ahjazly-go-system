
import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ""
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in ${className}`}>
            <div className="w-20 h-20 rounded-2xl bg-muted/40 flex items-center justify-center mb-6 animate-float">
                <Icon className="w-10 h-10 text-muted-foreground/60" strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button onClick={onAction} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
