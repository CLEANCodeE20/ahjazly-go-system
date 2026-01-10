import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  usePagePlacements,
  useUpdatePlacementOrder,
  UIComponentPlacement,
  UIPageLayout,
} from "@/hooks/useSDUI";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ArrowLeft, Monitor, Smartphone, Tablet, GripVertical, EyeOff, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getComponentPreview } from "./ComponentPreviews";
import { cn } from "@/lib/utils";

interface PageEditorProps {
  layout: UIPageLayout;
  onBack: () => void;
}

// Sortable Block Component
const SortableBlock = ({ placement, isOverlay = false }: { placement: UIComponentPlacement; isOverlay?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: placement.placement_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-200",
        isOverlay ? "scale-105 shadow-2xl z-50 cursor-grabbing" : "hover:scale-[1.01]"
      )}
    >
      {/* Hover Controls */}
      <div className={cn(
        "absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 rounded-full shadow-lg z-20 flex items-center gap-2 opacity-0 transition-opacity duration-200",
        !isOverlay && "group-hover:opacity-100"
      )}>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold whitespace-nowrap">{placement.component?.component_name}</span>
        <div className="w-px h-3 bg-white/20" />
        <button className="p-1 hover:bg-white/20 rounded">
          {placement.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
      </div>

      {/* Component Preview */}
      <div className={cn(
        "rounded-xl overflow-hidden border-2 transition-colors bg-background",
        isDragging ? "border-primary/50" : "border-transparent hover:border-primary/20",
        !placement.is_visible && "opacity-50 grayscale"
      )}>
        {placement.component && getComponentPreview(placement.component)}
      </div>
    </div>
  );
};

export const PageEditor = ({ layout, onBack }: PageEditorProps) => {
  const { data: initialPlacements, isLoading } = usePagePlacements(layout.layout_id);
  const updateOrder = useUpdatePlacementOrder();

  const [placements, setPlacements] = useState<UIComponentPlacement[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (initialPlacements) {
      setPlacements(initialPlacements);
    }
  }, [initialPlacements]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setPlacements((items) => {
        const oldIndex = items.findIndex((item) => item.placement_id === active.id);
        const newIndex = items.findIndex((item) => item.placement_id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          display_order: index + 1
        }));
      });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    const updates = placements.map((p) => ({
      placement_id: p.placement_id,
      display_order: p.display_order,
    }));

    await updateOrder.mutateAsync(updates);
    setHasChanges(false);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePlacement = activeId ? placements.find(p => p.placement_id === activeId) : null;

  return (
    <div className="fixed inset-0 bg-muted/10 z-50 flex flex-col animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="h-16 border-b bg-background px-6 flex items-center justify-between shadow-sm z-40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg">{layout.page_title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              محرر الصفحة المرئي
            </div>
          </div>
        </div>

        {/* Device Toggles */}
        <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
          <button
            onClick={() => setDevice('desktop')}
            className={cn("p-2 rounded-md transition-all", device === 'desktop' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={cn("p-2 rounded-md transition-all", device === 'tablet' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={cn("p-2 rounded-md transition-all", device === 'mobile' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={hasChanges ? "destructive" : "outline"} className="transition-colors">
            {hasChanges ? "تغييرات غير محفوظة" : "تم الحفظ"}
          </Badge>
          <Button onClick={handleSave} disabled={!hasChanges || updateOrder.isPending} className="gap-2">
            {updateOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden relative bg-muted/20 flex">
        {/* Left Sidebar (Tools) - Placeholder for future expansion */}
        <div className="w-64 border-r bg-background hidden lg:block p-4">
          <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">الأدوات</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border bg-card text-sm text-muted-foreground text-center border-dashed">
              سحب وإفلات مكونات جديدة (قريباً)
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div
            className={cn(
              "bg-background shadow-2xl transition-all duration-500 ease-in-out min-h-[800px] border rounded-lg relative",
              device === 'desktop' ? "w-full max-w-6xl" :
                device === 'tablet' ? "w-[768px]" : "w-[375px]"
            )}
          >
            {/* Canvas Header (Fake Browser Bar) */}
            <div className="h-8 bg-muted/50 border-b flex items-center px-4 gap-2 rounded-t-lg">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="mx-auto w-1/2 h-5 bg-background rounded-md text-[10px] flex items-center justify-center text-muted-foreground">
                ahjazly.com/{layout.page_key}
              </div>
            </div>

            {/* Canvas Content */}
            <div className="p-4 space-y-4 pb-32">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={placements.map(p => p.placement_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {placements.map((placement) => (
                      <SortableBlock key={placement.placement_id} placement={placement} />
                    ))}

                    {placements.length === 0 && (
                      <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                        <div className="mb-2">👋</div>
                        ابدأ بإضافة مكونات لهذه الصفحة
                      </div>
                    )}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={dropAnimation}>
                  {activePlacement ? (
                    <SortableBlock placement={activePlacement} isOverlay />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Properties) - Placeholder */}
        <div className="w-72 border-l bg-background hidden xl:block p-4">
          <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">خصائص الصفحة</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">عنوان الصفحة</label>
              <div className="p-2 rounded border bg-muted/20 text-sm">{layout.page_title}</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">الوصف</label>
              <div className="p-2 rounded border bg-muted/20 text-sm min-h-[60px]">{layout.page_description}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
