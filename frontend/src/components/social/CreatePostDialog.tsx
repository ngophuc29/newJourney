import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { PlusSquare } from "lucide-react";
import { toast } from "sonner";

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPostCreated?: () => void;
}

export default function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
    const { user } = useAuthStore();
    const [postContent, setPostContent] = useState("");
    const [postPrivacy, setPostPrivacy] = useState("public");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
            
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && selectedFiles.length === 0) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("content", postContent);
            formData.append("privacy", postPrivacy);
            selectedFiles.forEach(file => {
                formData.append("media", file);
            });

            const baseUrl = import.meta.env.VITE_API_URL;
            const token = useAuthStore.getState().accessToken;
            
            const response = await fetch(`${baseUrl}/posts`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setPostContent("");
                setSelectedFiles([]);
                setPreviews([]);
                onOpenChange(false);
                toast.success("Đăng bài viết thành công!");
                if (onPostCreated) {
                    onPostCreated();
                }
            } else {
                toast.error("Đăng bài thất bại. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Error creating post:", error);
            toast.error("Có lỗi xảy ra khi đăng bài.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border border-border/40 text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-center text-lg font-bold border-b border-border/40 pb-3">Tạo bài viết mới</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-2">
                    {/* User Header */}
                    {user && (
                        <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                                <AvatarImage src={user.avatarURL} alt={user.displayName} />
                                <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{user.displayName}</span>
                                <select 
                                    value={postPrivacy} 
                                    onChange={(e) => setPostPrivacy(e.target.value)}
                                    className="text-xs bg-accent border-none rounded px-1.5 py-0.5 mt-0.5 text-muted-foreground cursor-pointer focus:outline-none"
                                >
                                    <option value="public">🌍 Công khai</option>
                                    <option value="friends">👥 Bạn bè</option>
                                    <option value="private">🔒 Chỉ mình tôi</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Text Area */}
                    <Textarea
                        placeholder={`${user?.displayName || "Bạn"} đang nghĩ gì thế?`}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="min-h-[120px] bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-base"
                    />

                    {/* File Previews */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto beautiful-scrollbar p-1">
                            {previews.map((src, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="absolute top-1 right-1 size-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add to Post Area */}
                    <div className="flex items-center justify-between border border-border/40 rounded-xl p-3 bg-accent/20">
                        <span className="text-sm font-medium text-muted-foreground">Thêm vào bài viết</span>
                        <label className="cursor-pointer hover:bg-accent p-2 rounded-full transition-colors">
                            <PlusSquare className="size-6 text-emerald-500" />
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*,video/*" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleCreatePost}
                        disabled={uploading || (!postContent.trim() && selectedFiles.length === 0)}
                        className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-semibold rounded-xl py-6"
                    >
                        {uploading ? "Đang đăng bài..." : "Đăng bài"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
