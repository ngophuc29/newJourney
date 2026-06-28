import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X, Check } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { toast } from "sonner";
import ReplyPreview from "./ReplyPreview";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const {
    sendDirectMessage,
    sendGroupMessage,
    replyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,
  } = useChatStore();
  const { socket } = useSocketStore();

  // Focus input when reply/edit mode activates
  useEffect(() => {
    if (replyingTo || editingMessage) {
      inputRef.current?.focus();
    }
  }, [replyingTo, editingMessage]);

  // Pre-fill input when editing
  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content || "");
    }
  }, [editingMessage]);

  // Typing indicator logic
  const emitTyping = useCallback(() => {
    if (!socket || !selectedConvo?._id) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", { conversationId: selectedConvo._id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 1.5s of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stop-typing", { conversationId: selectedConvo._id });
    }, 1500);
  }, [socket, selectedConvo?._id]);

  // Cleanup typing timeout on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && socket && selectedConvo?._id) {
        socket.emit("stop-typing", { conversationId: selectedConvo._id });
        isTypingRef.current = false;
      }
    };
  }, [socket, selectedConvo?._id]);

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview("");
      return;
    }

    const url = URL.createObjectURL(mediaFile);
    setMediaPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  if (!user) return null;

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Chi ho tro gui anh hoac video");
      return;
    }

    setMediaFile(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview("");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setValue("");
  };

  const sendMessage = async () => {
    const currentValue = value.trim();
    const currentFile = mediaFile;

    // Stop typing indicator
    if (isTypingRef.current && socket && selectedConvo?._id) {
      socket.emit("stop-typing", { conversationId: selectedConvo._id });
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Handle edit mode
    if (editingMessage) {
      if (!currentValue) return;
      try {
        await editMessage(editingMessage._id, currentValue);
        setValue("");
      } catch (error) {
        console.log("Loi khi chinh sua tin nhan", error);
        toast.error("Loi khi chinh sua tin nhan");
      }
      return;
    }

    if (!currentValue && !currentFile) return;

    setSending(true);
    setValue("");

    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find(
          (p) => p._id !== user._id,
        );

        if (!otherUser) return;

        await sendDirectMessage(otherUser._id, currentValue, currentFile ?? undefined);
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          currentValue,
          currentFile ?? undefined,
        );
      }
      clearMedia();
    } catch (error) {
      console.log("Loi xay khi gui tin nhan", error);
      toast.error("Loi xay ra khi gui tin nhan, ban hay thu lai");
      setValue(currentValue);
      if (currentFile) setMediaFile(currentFile);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === "Escape" && editingMessage) {
      handleCancelEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Emit typing event (only when not in edit mode)
    if (!editingMessage && e.target.value.trim()) {
      emitTyping();
    }
  };

  const canSend = editingMessage ? !!value.trim() : !!value.trim() || !!mediaFile;
  const isVideo = mediaFile?.type.startsWith("video/");
  const mediaLabel = isVideo ? "video" : "anh";

  return (
    <div className="flex flex-col bg-background">
      {/* Reply Preview */}
      {replyingTo && !editingMessage && <ReplyPreview />}

      {/* Edit Mode Bar */}
      {editingMessage && (
        <div className="flex items-center gap-2 border border-b-0 border-border bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-t-lg animate-in slide-in-from-bottom-2 duration-150">
          <div className="h-8 w-0.5 shrink-0 rounded-full bg-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ✏️ Đang chỉnh sửa tin nhắn
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {editingMessage.content}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCancelEdit}
            className="shrink-0"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      <div className="p-3">
        {mediaPreview && !editingMessage && (
          <div className="relative w-fit max-w-[220px] rounded-md border border-border bg-muted p-2 mb-2">
            <Button
              type="button"
              variant="destructive"
              size="icon-xs"
              className="absolute -right-2 -top-2"
              disabled={sending}
              onClick={clearMedia}
            >
              <X className="size-3" />
            </Button>

            {isVideo ? (
              <video
                src={mediaPreview}
                className="max-h-36 rounded object-cover"
                controls
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-h-36 rounded object-cover"
              />
            )}

            {sending && mediaFile && (
              <div className="absolute inset-2 flex items-center justify-center rounded bg-background/80 text-xs font-medium text-foreground">
                Dang tai {mediaLabel}...
              </div>
            )}
          </div>
        )}

        <div className="flex min-h-[56px] items-center gap-2">
          {!editingMessage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                disabled={sending}
                onChange={handleSelectFile}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-gradient/10 transition-smooth"
                disabled={sending}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus />
              </Button>
            </>
          )}

          <div className="relative flex-1">
            <Input
              ref={inputRef}
              onKeyDown={handleKeyPress}
              value={value}
              onChange={handleInputChange}
              disabled={sending}
              placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : "Soan tin nhan"}
              className="resize-none border-border/50 bg-white pr-20 transition-smooth focus:border-primary/50"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center gap-1">
              {!editingMessage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={sending}
                  onClick={() => setOpen(!open)}
                >
                  :)
                </Button>
              )}

              {open && !editingMessage && (
                <div className="absolute bottom-12">
                  <EmojiPicker
                    onChange={(emoji: string) => setValue((prev) => prev + emoji)}
                  />
                </div>
              )}
            </div>
          </div>

          {editingMessage ? (
            <Button
              className="bg-amber-500 hover:bg-amber-600 transition-smooth"
              disabled={!canSend}
              onClick={sendMessage}
            >
              <Check className="size-4 text-white" />
            </Button>
          ) : (
            <Button
              className="bg-gradient-chat transition-smooth hover:scale-150 hover:shadow-glow"
              disabled={!canSend || sending}
              onClick={sendMessage}
            >
              {sending && mediaFile ? (
                <span className="text-xs text-white">Dang tai...</span>
              ) : (
                <Send className="size-4 text-white" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
