import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

const TypingIndicator = () => {
  const { activeConversationId, typingUsers } = useChatStore();
  const { user } = useAuthStore();

  if (!activeConversationId) return null;

  const currentTypers = (typingUsers[activeConversationId] || []).filter(
    (t) => t.userId !== user?._id
  );

  if (currentTypers.length === 0) return null;

  const names = currentTypers.map((t) => t.displayName);
  const label =
    names.length === 1
      ? `${names[0]} đang soạn tin`
      : names.length === 2
        ? `${names[0]} và ${names[1]} đang soạn tin`
        : `${names[0]} và ${names.length - 1} người khác đang soạn tin`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-0.5">
        <span
          className="inline-block size-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <span
          className="inline-block size-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "150ms", animationDuration: "1s" }}
        />
        <span
          className="inline-block size-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "300ms", animationDuration: "1s" }}
        />
      </div>
      <span className="italic">{label}...</span>
    </div>
  );
};

export default TypingIndicator;
