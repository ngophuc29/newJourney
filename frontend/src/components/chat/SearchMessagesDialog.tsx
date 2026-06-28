import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Message } from "@/types/chat";
import { formatMessageTime } from "@/lib/utils";

interface SearchMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchMessagesDialog = ({ open, onOpenChange }: SearchMessagesDialogProps) => {
  const { activeConversationId, searchMessages } = useChatStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !activeConversationId) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const found = await searchMessages(activeConversationId, query.trim());
      setResults(found);
    } catch (error) {
      console.log("Loi khi tim kiem", error);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim() || !text) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-primary/30 px-0.5 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Tìm kiếm tin nhắn
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập từ khóa..."
                className="pr-8"
                autoFocus
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                  onClick={handleClear}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || searching}>
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tìm kiếm...
              </div>
            )}

            {!searching && hasSearched && results.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Không tìm thấy tin nhắn nào
              </div>
            )}

            {!searching && results.map((msg) => {
              const isOwn = msg.senderId === user?._id;
              // senderId from search API is populated as an object
              const senderObj = msg.senderId as unknown as { _id: string; displayName: string; avatarURL?: string };
              const senderName = typeof senderObj === 'object' && senderObj?.displayName
                ? senderObj.displayName
                : isOwn ? "Bạn" : "Người dùng";

              return (
                <div
                  key={msg._id}
                  className="cursor-pointer rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-muted/50"
                >
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">{senderName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatMessageTime(new Date(msg.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {highlightMatch(msg.content || "", query)}
                  </p>
                </div>
              );
            })}
          </div>

          {!searching && results.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Tìm thấy {results.length} kết quả
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchMessagesDialog;
