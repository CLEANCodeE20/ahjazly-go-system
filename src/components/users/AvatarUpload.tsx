import { useState, useRef } from "react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
    currentAvatar?: string | null;
    initials?: string;
    onUpload: (file: File) => Promise<boolean>;
    onDelete?: () => Promise<boolean>;
    uploading?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
}

export const AvatarUpload = ({
    currentAvatar,
    initials,
    onUpload,
    onDelete,
    uploading = false,
    size = "xl"
}: AvatarUploadProps) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار ملف صورة');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        const success = await onUpload(file);
        if (success) {
            setPreview(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDelete = async () => {
        if (onDelete && confirm('هل أنت متأكد من حذف الصورة الشخصية؟')) {
            await onDelete();
            setPreview(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Display */}
            <div className="relative">
                <UserAvatar
                    src={preview || currentAvatar}
                    initials={initials}
                    size={size}
                    className={cn(
                        "transition-all",
                        uploading && "opacity-50"
                    )}
                />

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Camera Icon Overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    <Camera className="w-4 h-4" />
                </button>
            </div>

            {/* Upload Area */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center transition-colors w-full max-w-sm",
                    isDragging ? "border-primary bg-primary/5" : "border-border",
                    uploading && "opacity-50 pointer-events-none"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={uploading}
                />

                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">
                    اسحب الصورة هنا أو انقر للاختيار
                </p>
                <p className="text-xs text-muted-foreground">
                    PNG, JPG حتى 2MB
                </p>

                <div className="flex gap-2 mt-4 justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload className="w-4 h-4 ml-2" />
                        اختيار صورة
                    </Button>

                    {(currentAvatar || preview) && onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            disabled={uploading}
                            className="text-destructive hover:text-destructive"
                        >
                            <X className="w-4 h-4 ml-2" />
                            حذف
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
