import { Heart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/User";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

type Props = {
    userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
    const { setUser } = useAuthStore();
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userInfo) {
            setDisplayName(userInfo.displayName || "");
            setBio(userInfo.bio || "");
            setPhone(userInfo.phone || "");
        }
    }, [userInfo]);

    if (!userInfo) return null;

    const handleSave = async () => {
        if (!displayName.trim()) {
            toast.error("Tên hiển thị không được bỏ trống");
            return;
        }

        setSaving(true);
        try {
            const res = await api.put("/users/profile", {
                displayName,
                bio,
                phone,
            });
            setUser(res.data.user);
            toast.success("Cập nhật thông tin thành công!");
        } catch (error: any) {
            console.error("Lỗi khi lưu profile:", error);
            const msg = error.response?.data?.message || "Cập nhật thất bại";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="glass-strong border-border/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                    Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Tên hiển thị</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="glass-light border-border/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Tên người dùng</Label>
                        <Input
                            id="username"
                            value={userInfo.username || ""}
                            disabled
                            className="bg-muted/40 cursor-not-allowed opacity-70 border-border/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={userInfo.email || ""}
                            disabled
                            className="bg-muted/40 cursor-not-allowed opacity-70 border-border/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="glass-light border-border/30"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Giới thiệu</Label>
                    <Textarea
                        id="bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="glass-light border-border/30 resize-none"
                    />
                </div>

                <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Lưu thay đổi
                </Button>
            </CardContent>
        </Card>
    );
};

export default PersonalInfoForm;