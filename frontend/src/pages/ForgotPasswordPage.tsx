import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Vui lòng nhập email");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
            toast.success("Link đặt lại mật khẩu đã được gửi!");
        } catch (error: any) {
            console.error("Lỗi khi gửi yêu cầu quên mật khẩu:", error);
            const msg = error.response?.data?.message || "Gửi yêu cầu thất bại";
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
                        <CardTitle className="text-2xl font-bold">Quên mật khẩu?</CardTitle>
                        <CardDescription>
                            Nhập email của bạn và chúng tôi sẽ gửi cho bạn link để đặt lại mật khẩu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="space-y-4 text-center">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary text-sm font-medium">
                                    Link khôi phục đã được gửi về: <br /><strong>{email}</strong>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Vui lòng kiểm tra hòm thư của bạn (bao gồm cả thư rác/spam).
                                </p>
                                <Button 
                                    onClick={() => window.location.href = "/signin"}
                                    className="w-full flex items-center justify-center gap-2"
                                    variant="outline"
                                >
                                    <ArrowLeft className="size-4" /> Quay lại Đăng nhập
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Địa chỉ Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                    Gửi link đặt lại mật khẩu
                                </Button>
                                <Button 
                                    type="button"
                                    onClick={() => window.location.href = "/signin"}
                                    className="w-full flex items-center justify-center gap-2"
                                    variant="ghost"
                                >
                                    <ArrowLeft className="size-4" /> Quay lại Đăng nhập
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
