import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const ConversationSkeleton = () => {
    // Array of different widths to make the list look natural and realistic
    const itemsConfig = [
        { nameWidth: "w-1/2", msgWidth: "w-[75%]" },
        { nameWidth: "w-[60%]", msgWidth: "w-[50%]" },
        { nameWidth: "w-1/3", msgWidth: "w-[80%]" },
        { nameWidth: "w-[55%]", msgWidth: "w-[40%]" },
        { nameWidth: "w-[45%]", msgWidth: "w-[70%]" },
        { nameWidth: "w-1/2", msgWidth: "w-[55%]" },
    ];

    return (
        <div className="space-y-2 p-1">
            {itemsConfig.map((item, index) => (
                <Card
                    key={index}
                    className="border-none p-3 bg-transparent hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {/* Avatar skeleton */}
                        <Skeleton className="size-10 rounded-full flex-shrink-0" />

                        {/* Info skeleton */}
                        <div className="flex-1 space-y-2.5">
                            <Skeleton className={`h-3.5 ${item.nameWidth} rounded`} />
                            <Skeleton className={`h-3 ${item.msgWidth} rounded opacity-75`} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default ConversationSkeleton;