import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    src?: string | null;
    alt?: string;
    initials?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    onClick?: () => void;
}

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-24 h-24 text-2xl"
};

export const UserAvatar = ({
    src,
    alt = "User",
    initials,
    size = "md",
    className,
    onClick
}: UserAvatarProps) => {
    const sizeClass = sizeClasses[size];

    if (src) {
        return (
            <div
                className={cn(
                    "rounded-full overflow-hidden border-2 border-border bg-muted flex-shrink-0",
                    sizeClass,
                    onClick && "cursor-pointer hover:opacity-80 transition-opacity",
                    className
                )}
                onClick={onClick}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-full border-2 border-border bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary flex-shrink-0",
                sizeClass,
                onClick && "cursor-pointer hover:opacity-80 transition-opacity",
                className
            )}
            onClick={onClick}
        >
            {initials || <User className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : size === "lg" ? "w-8 h-8" : "w-12 h-12"} />}
        </div>
    );
};
