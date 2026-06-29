import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error("Token đặt lại mật khẩu không tồn tại.");
            return;
        }

        if (password.length < 8) {
            toast.error("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password });
            toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
            navigate("/signin");
        } catch (error: any) {
            console.error("Lỗi khi đặt lại mật khẩu:", error);
            const msg = error.response?.data?.message || "Đặt lại mật khẩu thất bại";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
            <div className="w-full max-w-md">
                <Card className="border-border">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
                        <CardDescription>
                            Nhập mật khẩu mới của bạn bên dưới.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!token ? (
                            <div className="space-y-4 text-center">
                                <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm font-medium">
                                    Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                                </div>
                                <Button 
                                    onClick={() => navigate("/signin")}
                                    className="w-full flex items-center justify-center gap-2"
                                    variant="outline"
                                >
                                    <ArrowLeft className="size-4" /> Quay lại Đăng nhập
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mật khẩu mới</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                    Đặt lại mật khẩu
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
