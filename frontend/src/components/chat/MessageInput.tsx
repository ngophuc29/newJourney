import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Send, X, Check, Paperclip, Mic, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { toast } from "sonner";
import ReplyPreview from "./ReplyPreview";
import MentionDropdown from "./MentionDropdown";
import FilePreviewCard from "./FilePreviewCard";
import api from "@/lib/axios";
import GifPicker from "./GifPicker";

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

  // Mention State
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Voice Preview State
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioPreviewBlob, setAudioPreviewBlob] = useState<Blob | null>(null);
  const [audioPreviewDuration, setAudioPreviewDuration] = useState(0);

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

    // Remove strict image/video check to allow documents/zips
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

  // Voice Recording Helpers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Lỗi khi truy cập micro:", err);
      toast.error("Không thể truy cập micro. Vui lòng cấp quyền.");
    }
  };

  const stopRecordingAndPreview = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    const duration = recordingTime;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioPreviewUrl(audioUrl);
      setAudioPreviewBlob(audioBlob);
      setAudioPreviewDuration(duration);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const sendVoiceMessage = async () => {
    if (!audioPreviewBlob || !audioPreviewDuration) return;

    const audioFile = new File([audioPreviewBlob], "voice_message.webm", { type: "audio/webm" });
    setSending(true);
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user?._id);
        if (!otherUser) return;
        
        const formData = new FormData();
        formData.append("recipientId", otherUser._id);
        formData.append("file", audioFile);
        formData.append("duration", audioPreviewDuration.toString());
        if (selectedConvo._id) formData.append("conversationId", selectedConvo._id);

        await api.post("/message/direct", formData);
      } else {
        const formData = new FormData();
        formData.append("conversationId", selectedConvo._id);
        formData.append("file", audioFile);
        formData.append("duration", audioPreviewDuration.toString());

        await api.post("/message/group", formData);
      }
      toast.success("Đã gửi tin nhắn thoại");
      clearAudioPreview();
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn thoại:", error);
      toast.error("Không thể gửi tin nhắn thoại");
    } finally {
      setSending(false);
    }
  };

  const clearAudioPreview = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioPreviewUrl(null);
    setAudioPreviewBlob(null);
    setAudioPreviewDuration(0);
    audioChunksRef.current = [];
  };

  const handleSelectGif = async (gifUrl: string) => {
    setSending(true);
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user?._id);
        if (!otherUser) return;
        await sendDirectMessage(otherUser._id, "", undefined, [], gifUrl, "image");
      } else {
        await sendGroupMessage(selectedConvo._id, "", undefined, [], gifUrl, "image");
      }
      toast.success("Đã gửi GIF");
    } catch (error) {
      console.error("Lỗi khi gửi GIF:", error);
      toast.error("Không thể gửi GIF");
    } finally {
      setSending(false);
    }
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    mediaRecorderRef.current.onstop = () => {
      audioChunksRef.current = [];
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatRecordingTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Mention Helpers
  const handleMentionSelect = (participant: Participant) => {
    if (mentionTriggerIndex === -1) return;

    const beforeMention = value.substring(0, mentionTriggerIndex);
    const afterMention = value.substring(inputRef.current?.selectionStart || value.length);
    const displayName = participant.displayName;

    const newValue = `${beforeMention}@${displayName} ${afterMention}`;
    setValue(newValue);
    setMentionedIds((prev) => [...prev, participant._id]);
    setMentionOpen(false);

    // Focus input and place cursor after the mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeMention.length + displayName.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
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
    setMentionedIds([]);

    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find(
          (p) => p._id !== user._id,
        );

        if (!otherUser) return;

        await sendDirectMessage(otherUser._id, currentValue, currentFile ?? undefined, mentionedIds);
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          currentValue,
          currentFile ?? undefined,
          mentionedIds,
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
    const text = e.target.value;
    setValue(text);
    // Emit typing event (only when not in edit mode)
    if (!editingMessage && text.trim()) {
      emitTyping();
    }

    // Mention detection (only in group chats)
    if (selectedConvo.type === "group") {
      const selectionStart = e.target.selectionStart || 0;
      const textBeforeCursor = text.substring(0, selectionStart);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ")) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        if (!query.includes(" ")) {
          setMentionOpen(true);
          setMentionQuery(query);
          setMentionTriggerIndex(lastAtIndex);
          return;
        }
      }
    }
    setMentionOpen(false);
  };

  const canSend = editingMessage ? !!value.trim() : !!value.trim() || !!mediaFile;
  const isImage = mediaFile?.type.startsWith("image/");
  const isVideo = mediaFile?.type.startsWith("video/");
  const mediaLabel = isImage ? "anh" : isVideo ? "video" : "file";

  const partner = selectedConvo.type === "direct" 
    ? selectedConvo.participants.find((p) => p._id !== user?._id) 
    : null;
  const partnerName = partner?.displayName || "người dùng này";

  if (selectedConvo.type === "direct" && selectedConvo.partnerBlockedUs) {
    return (
      <div className="p-4 text-center bg-background border-t border-border/40">
        <div className="py-3 px-4 text-sm font-semibold text-destructive bg-destructive/10 rounded-2xl border border-dashed border-destructive/30">
          Bạn đã bị {partnerName} chặn
        </div>
      </div>
    );
  }

  const isBlockedByUs = user?.blockedUsers?.map((id: any) => 
    typeof id === "object" ? id._id || id.toString() : id.toString()
  ).includes(partner?._id);

  const handleUnblock = async () => {
    if (!partner?._id) return;
    try {
      await api.post(`/users/unblock/${partner._id}`);
      toast.success(`Đã bỏ chặn ${partnerName}`);
      if (user) {
        const updatedBlocked = (user.blockedUsers || []).filter(
          (id: any) => (typeof id === "object" ? id._id !== partner._id : id !== partner._id)
        );
        useAuthStore.getState().setUser({ ...user, blockedUsers: updatedBlocked });
      }
      // Cập nhật lại danh sách hội thoại của người chặn
      useChatStore.getState().fetchConversation();
    } catch (error) {
      console.error("Lỗi khi bỏ chặn:", error);
      toast.error("Không thể bỏ chặn");
    }
  };

  if (selectedConvo.type === "direct" && isBlockedByUs) {
    return (
      <div className="p-4 text-center bg-background border-t border-border/40">
        <div className="py-3 px-4 text-sm font-semibold text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border/50 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Bạn đã chặn {partnerName}.</span>
          <Button 
            variant="link" 
            onClick={handleUnblock}
            className="text-primary hover:text-primary-hover p-0 h-auto font-bold underline cursor-pointer"
          >
            Bỏ chặn
          </Button>
        </div>
      </div>
    );
  }

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
              className="absolute -right-2 -top-2 z-10"
              disabled={sending}
              onClick={clearMedia}
            >
              <X className="size-3" />
            </Button>

            {isImage ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-h-36 rounded object-cover"
              />
            ) : isVideo ? (
              <video
                src={mediaPreview}
                className="max-h-36 rounded object-cover"
                controls
              />
            ) : (
              <FilePreviewCard
                fileName={mediaFile?.name || "file"}
                fileSize={mediaFile?.size}
                mediaUrl={mediaPreview}
                compact
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
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,.ppt,.pptx"
                className="hidden"
                disabled={sending}
                onChange={handleSelectFile}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-gradient/10 transition-smooth text-muted-foreground"
                disabled={sending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-gradient/10 transition-smooth text-muted-foreground"
                disabled={sending || !!audioPreviewUrl}
                onClick={startRecording}
              >
                <Mic className="size-5" />
              </Button>
            </>
          )}

          {isRecording ? (
            <div className="flex flex-1 items-center justify-between bg-muted/60 rounded-full px-4 py-2 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-destructive animate-ping" />
                <span className="text-xs font-semibold text-destructive">Đang ghi âm...</span>
                <span className="text-xs font-mono text-muted-foreground">{formatRecordingTime(recordingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={cancelRecording}
                  className="text-muted-foreground hover:text-destructive rounded-full"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  type="button"
                  onClick={stopRecordingAndPreview}
                  disabled={sending}
                  className="bg-primary hover:bg-primary-hover text-white rounded-full size-8 p-0 flex items-center justify-center shadow-md"
                >
                  <Send className="size-3.5 fill-current ml-0.5" />
                </Button>
              </div>
            </div>
          ) : audioPreviewUrl ? (
            <div className="flex flex-1 items-center justify-between bg-muted/60 rounded-full px-4 py-2 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-semibold text-primary shrink-0">Nghe lại:</span>
                <audio src={audioPreviewUrl} controls className="h-8 max-w-full flex-1 max-h-8 scale-95 origin-left" />
                <span className="text-xs font-mono text-muted-foreground shrink-0">{formatRecordingTime(audioPreviewDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={clearAudioPreview}
                  className="text-muted-foreground hover:text-destructive rounded-full"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  type="button"
                  onClick={sendVoiceMessage}
                  disabled={sending}
                  className="bg-primary hover:bg-primary-hover text-white rounded-full size-8 p-0 flex items-center justify-center shadow-md"
                >
                  <Send className="size-3.5 fill-current ml-0.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                onKeyDown={handleKeyPress}
                value={value}
                onChange={handleInputChange}
                disabled={sending}
                placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : "Soan tin nhan"}
                className="resize-none border-border/50 bg-white pr-24 transition-smooth focus:border-primary/50"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center gap-1">
                {!editingMessage && (
                  <>
                    <GifPicker onSelect={handleSelectGif} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={sending}
                      onClick={() => setOpen(!open)}
                    >
                      :)
                    </Button>
                  </>
                )}

                {open && !editingMessage && (
                  <div className="absolute bottom-12">
                    <EmojiPicker
                      onChange={(emoji: string) => setValue((prev) => prev + emoji)}
                    />
                  </div>
                )}
              </div>

              {/* Mention Dropdown */}
              {mentionOpen && selectedConvo.type === "group" && (
                <MentionDropdown
                  participants={selectedConvo.participants.filter(p => p._id !== user._id)}
                  query={mentionQuery}
                  onSelect={handleMentionSelect}
                  onClose={() => setMentionOpen(false)}
                  visible={mentionOpen}
                />
              )}
            </div>
          )}

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
