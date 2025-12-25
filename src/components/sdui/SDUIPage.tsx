import { usePageComponents } from "@/hooks/useSDUI";
import { SDUISection } from "./SDUISection";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface SDUIPageProps {
    pageKey: string;
}

export const SDUIPage = ({ pageKey }: SDUIPageProps) => {
    const { data: placements = [], isLoading, error } = usePageComponents(pageKey);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        console.error(`Error loading SDUI page ${pageKey}:`, error);
        return null;
    }

    return (
        <div className="flex flex-col">
            {placements.map((placement) => (
                placement.component && (
                    <SDUISection
                        key={placement.placement_id}
                        component={placement.component}
                    />
                )
            ))}
        </div>
    );
};
