import { UIComponent } from "@/hooks/useSDUI";
import {
    LayoutTemplate,
    Type,
    Image as ImageIcon,
    MousePointerClick,
    BarChart3,
    List,
    Shield,
    CheckCircle2,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewProps {
    component: UIComponent;
}

export const PreviewHero = ({ component }: PreviewProps) => {
    return (
        <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary/90 to-primary/70 rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494515855673-b841b096e9d5?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
            <div className="relative z-10 space-y-3">
                <div className="h-2 w-24 bg-white/20 rounded-full mx-auto" />
                <h3 className="text-xl font-bold text-white max-w-[80%] mx-auto leading-tight">
                    {component.title || "عنوان الهيرو"}
                </h3>
                <p className="text-white/80 text-xs max-w-[60%] mx-auto line-clamp-2">
                    {component.content || "وصف قصير للمحتوى يظهر هنا..."}
                </p>
                <div className="flex gap-2 justify-center pt-2">
                    <div className="h-8 w-24 bg-white text-primary text-xs font-bold rounded flex items-center justify-center">
                        {component.button_text || "زر رئيسي"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PreviewFeatures = ({ component }: PreviewProps) => {
    return (
        <div className="w-full bg-card border rounded-lg p-6 space-y-4">
            <div className="text-center space-y-2">
                <h3 className="font-bold text-foreground">{component.title || "المميزات"}</h3>
                <div className="h-1 w-12 bg-primary/20 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted/30 p-3 rounded border text-center space-y-2">
                        <div className="w-8 h-8 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            <List className="w-4 h-4 text-primary" />
                        </div>
                        <div className="h-2 w-12 bg-muted-foreground/20 mx-auto rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PreviewStats = ({ component }: PreviewProps) => {
    return (
        <div className="w-full bg-primary/5 border border-primary/10 rounded-lg p-6">
            <div className="grid grid-cols-4 gap-4 text-center">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-1">
                        <div className="text-lg font-bold text-primary">100+</div>
                        <div className="text-[10px] text-muted-foreground">إحصائية</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PreviewCTA = ({ component }: PreviewProps) => {
    return (
        <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-8 text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center gap-3">
                <h3 className="text-lg font-bold text-white">{component.title || "دعوة لاتخاذ إجراء"}</h3>
                <p className="text-white/60 text-xs max-w-sm">{component.content}</p>
                <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="secondary" className="h-8 text-xs">
                        {component.button_text || "ابدأ الآن"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const PreviewGeneric = ({ component }: PreviewProps) => {
    return (
        <div className="w-full bg-card border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-muted-foreground/50" />
            <div>
                <h3 className="font-medium text-foreground">{component.component_name}</h3>
                <p className="text-xs text-muted-foreground">{component.component_type}</p>
            </div>
        </div>
    );
};

export const getComponentPreview = (component: UIComponent) => {
    switch (component.component_type) {
        case 'hero':
            return <PreviewHero component={component} />;
        case 'features':
            return <PreviewFeatures component={component} />;
        case 'stats':
            return <PreviewStats component={component} />;
        case 'cta':
            return <PreviewCTA component={component} />;
        default:
            return <PreviewGeneric component={component} />;
    }
};
