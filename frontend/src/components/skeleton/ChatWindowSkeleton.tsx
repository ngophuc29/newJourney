import { SidebarInset } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";

const ChatWindowSkeleton = () => {
    return (
        <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md bg-transparent">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-background border-b border-border/40">
                <div className="flex items-center gap-3 w-full">
                    {/* Sidebar Trigger placeholder */}
                    <Skeleton className="h-8 w-8 rounded-md" />
                    
                    <div className="h-4 w-px bg-border/60 mx-1" />

                    {/* Avatar skeleton */}
                    <Skeleton className="h-10 w-10 rounded-full" />

                    {/* Name and Status skeleton */}
                    <div className="flex flex-col gap-1.5 flex-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full bg-primary-foreground p-4 overflow-y-auto gap-6 beautiful-scrollbar">
                {/* Messages Skeleton */}
                {/* Message 1 (Received) */}
                <div className="flex items-end gap-3 max-w-[75%]">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                        <Skeleton className="h-10 w-[60%] rounded-2xl rounded-bl-none" />
                        <Skeleton className="h-3 w-12 rounded ml-1" />
                    </div>
                </div>

                {/* Message 2 (Sent) */}
                <div className="flex items-end gap-3 max-w-[75%] ml-auto flex-row-reverse">
                    <div className="flex flex-col gap-1 items-end w-full">
                        <Skeleton className="h-14 w-[80%] rounded-2xl rounded-br-none" />
                        <Skeleton className="h-3 w-12 rounded mr-1" />
                    </div>
                </div>

                {/* Message 3 (Received) */}
                <div className="flex items-end gap-3 max-w-[75%]">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                        <Skeleton className="h-16 w-[75%] rounded-2xl rounded-bl-none" />
                        <Skeleton className="h-3 w-12 rounded ml-1" />
                    </div>
                </div>

                {/* Message 4 (Sent) */}
                <div className="flex items-end gap-3 max-w-[75%] ml-auto flex-row-reverse">
                    <div className="flex flex-col gap-1 items-end w-full">
                        <Skeleton className="h-10 w-[45%] rounded-2xl rounded-br-none" />
                        <Skeleton className="h-3 w-12 rounded mr-1" />
                    </div>
                </div>

                {/* Message 5 (Received) */}
                <div className="flex items-end gap-3 max-w-[75%]">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                        <Skeleton className="h-10 w-[50%] rounded-2xl rounded-bl-none" />
                        <Skeleton className="h-3 w-12 rounded ml-1" />
                    </div>
                </div>
            </div>

            {/* Message Input Area Skeleton */}
            <div className="p-4 bg-background border-t border-border/40 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                
                {/* Input field skeleton */}
                <Skeleton className="h-10 flex-1 rounded-full" />
                
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
            </div>
        </SidebarInset>
    );
};

export default ChatWindowSkeleton;