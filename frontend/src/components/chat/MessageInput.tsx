import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendDirectMessage, sendGroupMessage } = useChatStore();

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

  const sendMessage = async () => {
    const currentValue = value.trim();
    const currentFile = mediaFile;

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
  };

  const canSend = !!value.trim() || !!mediaFile;
  const isVideo = mediaFile?.type.startsWith("video/");
  const mediaLabel = isVideo ? "video" : "anh";

  return (
    <div className="flex flex-col gap-2 bg-background p-3">
      {mediaPreview && (
        <div className="relative w-fit max-w-[220px] rounded-md border border-border bg-muted p-2">
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

        <div className="relative flex-1">
          <Input
            onKeyDown={handleKeyPress}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            disabled={sending}
            placeholder="Soan tin nhan"
            className="resize-none border-border/50 bg-white pr-20 transition-smooth focus:border-primary/50"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={sending}
              onClick={() => setOpen(!open)}
            >
              :)
            </Button>

            {open && (
              <div className="absolute bottom-12">
                <EmojiPicker
                  onChange={(emoji: string) => setValue((prev) => prev + emoji)}
                />
              </div>
            )}
          </div>
        </div>
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
      </div>
    </div>
  );
};

export default MessageInput;
