import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import UserAvatar from "./UserAvatar";
import type { ReaderInfo } from "@/types/chat";
import { chatService } from "@/services/chatService";
import { Loader2, Eye } from "lucide-react";

interface ReadReceiptsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: string;
    messageId: string;
}

const formatReadTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const ReadReceiptsDialog = ({
    open,
    onOpenChange,
    conversationId,
    messageId,
}: ReadReceiptsDialogProps) => {
    const [readers, setReaders] = useState<ReaderInfo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        const fetchReaders = async () => {
            setLoading(true);
            try {
                const data = await chatService.getMessageReaders(conversationId, messageId);
                setReaders(data);
            } catch (error) {
                console.log("Loi khi lay danh sach nguoi doc", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReaders();
    }, [open, conversationId, messageId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="size-4 text-primary" />
                        Đã xem bởi
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                    ) : readers.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Chưa ai xem tin nhắn này
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {readers.map((reader) => (
                                <div
                                    key={reader._id}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                                >
                                    <UserAvatar
                                        type="chat"
                                        name={reader.displayName}
                                        avatarURL={reader.avatarURL ?? undefined}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {reader.displayName}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatReadTime(reader.readAt)}
                                        </p>
                                    </div>
                                    <Eye className="size-3.5 shrink-0 text-primary/50" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReadReceiptsDialog;
