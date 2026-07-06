import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import { useEffect, useRef, useState } from "react";

interface MentionDropdownProps {
    participants: {
        _id: string;
        displayName: string;
        avatarURL?: string | null;
        username?: string;
    }[];
    query: string;
    onSelect: (participant: any) => void;
    onClose: () => void;
    visible: boolean;
}

const MentionDropdown = ({
    participants,
    query,
    onSelect,
    onClose,
    visible,
}: MentionDropdownProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    const filtered = participants.filter((p) =>
        p.displayName.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        if (!visible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                onSelect(filtered[selectedIndex]);
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [visible, filtered, selectedIndex, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        const container = listRef.current;
        if (!container) return;
        const items = container.querySelectorAll("[data-mention-item]");
        const target = items[selectedIndex] as HTMLElement | undefined;
        if (target) {
            target.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);

    if (!visible || filtered.length === 0) return null;

    return (
        <div
            ref={listRef}
            className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg animate-in slide-in-from-bottom-2 duration-150"
        >
            {filtered.map((p, index) => (
                <button
                    key={p._id}
                    type="button"
                    data-mention-item
                    className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                        index === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                    )}
                    onClick={() => onSelect(p)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <UserAvatar
                        type="chat"
                        name={p.displayName}
                        avatarURL={p.avatarURL ?? undefined}
                    />
                    <span className="truncate font-medium">{p.displayName}</span>
                </button>
            ))}
        </div>
    );
};

export default MentionDropdown;
