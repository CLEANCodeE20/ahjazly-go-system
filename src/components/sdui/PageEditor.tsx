import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GripVertical, Save, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageEditorProps {
    layout: UIPageLayout;
    onBack: () => void;
}

// Sortable Item Component
const SortableItem = ({ placement }: { placement: UIComponentPlacement }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: placement.placement_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-4 bg-card border rounded-xl mb-3 shadow-sm hover:shadow-md transition-shadow"
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground">
                        {placement.component?.component_name || "مكون غير معروف"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                        {placement.component?.component_type}
                    </Badge>
                    {!placement.is_visible && (
                        <Badge variant="secondary" className="text-xs">
                            مخفي
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    {placement.component?.title || "بدون عنوان"}
                </p>
            </div>

            <div className="text-sm text-muted-foreground font-mono">
                #{placement.display_order}
            </div>
        </div>
    );
};

export const PageEditor = ({ layout, onBack }: PageEditorProps) => {
    const { data: initialPlacements, isLoading } = usePagePlacements(layout.layout_id);
    const updateOrder = useUpdatePlacementOrder();

    const [placements, setPlacements] = useState<UIComponentPlacement[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (initialPlacements) {
            setPlacements(initialPlacements);
        }
    }, [initialPlacements]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setPlacements((items) => {
                const oldIndex = items.findIndex((item) => item.placement_id === active.id);
                const newIndex = items.findIndex((item) => item.placement_id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update display_order based on new index
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">تخطيط الصفحة: {layout.page_title}</h2>
                        <p className="text-muted-foreground">اسحب المكونات لإعادة ترتيبها</p>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={!hasChanges || updateOrder.isPending}>
                    {updateOrder.isPending ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 ml-2" />
                    )}
                    حفظ الترتيب
                </Button>
            </div>

            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="text-base font-medium">المكونات النشطة</CardTitle>
                </CardHeader>
                <CardContent>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={placements.map(p => p.placement_id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {placements.map((placement) => (
                                    <SortableItem key={placement.placement_id} placement={placement} />
                                ))}

                                {placements.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                        لا توجد مكونات في هذه الصفحة.
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </CardContent>
            </Card>
        </div>
    );
};
