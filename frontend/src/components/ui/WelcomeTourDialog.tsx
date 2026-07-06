import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { ChevronLeft, ChevronRight, Sparkles, Share2, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function WelcomeTourDialog() {
    const { accessToken } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const welcomed = localStorage.getItem("newjourney_welcomed");
        if (accessToken && !welcomed) {
            // Delay 1.5s for smooth presentation after layout mounts
            const timer = setTimeout(() => {
                setOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [accessToken]);

    const handleClose = () => {
        localStorage.setItem("newjourney_welcomed", "true");
        setOpen(false);
    };

    const steps = [
        {
            title: "Khởi đầu Hành trình mới 🚀",
            description: "Chào mừng bạn đến với NewJourney! Mạng xã hội hiện đại kết nối giới trẻ, giúp bạn tự do chia sẻ những góc nhìn cá nhân và gắn kết cùng bạn bè.",
            icon: <Sparkles className="size-16 text-violet-500 animate-pulse" />,
            gradient: "from-violet-600/20 to-pink-500/20"
        },
        {
            title: "Khoảnh khắc sống động 📸",
            description: "Đăng tải bài viết kèm hình ảnh, video chất lượng cao. Đăng tải Story 24h đầy cá tính và gắn thẻ bạn bè dễ dàng qua tính năng @mention vừa ra mắt.",
            icon: <Share2 className="size-16 text-pink-500" />,
            gradient: "from-pink-600/20 to-rose-500/20"
        },
        {
            title: "Trò chuyện & Gọi điện tức thì 💬",
            description: "Trò chuyện thời gian thực với bạn bè qua chat đơn hoặc chat nhóm. Ghim tin nhắn quan trọng, đổi biệt danh và gọi điện voice/video call cực mượt.",
            icon: <MessageSquare className="size-16 text-emerald-500" />,
            gradient: "from-emerald-600/20 to-teal-500/20"
        },
        {
            title: "Riêng tư & Bảo mật tối đa 🛡️",
            description: "Tự chủ cài đặt chế độ riêng tư cho từng bài đăng. Quản lý danh sách thiết bị đang hoạt động và đăng xuất từ xa bất cứ lúc nào.",
            icon: <ShieldCheck className="size-16 text-blue-500" />,
            gradient: "from-blue-600/20 to-indigo-500/20"
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
            <DialogContent className="sm:max-w-[480px] bg-card border border-border/40 text-foreground overflow-hidden rounded-2xl p-0">
                {/* Top Banner Gradient */}
                <div className={`w-full h-44 bg-gradient-to-br ${steps[currentStep].gradient} flex items-center justify-center transition-all duration-300 relative`}>
                    {steps[currentStep].icon}
                    <span className="absolute top-4 left-4 text-xs font-semibold bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-white">
                        {currentStep + 1} / {steps.length}
                    </span>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">
                            {steps[currentStep].title}
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground text-center leading-relaxed min-h-[72px]">
                        {steps[currentStep].description}
                    </p>

                    {/* Step Dots */}
                    <div className="flex justify-center gap-1.5 my-2">
                        {steps.map((_, idx) => (
                            <span 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-200 ${idx === currentStep ? "bg-primary w-5" : "bg-muted-foreground/30 w-1.5"}`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-2">
                        {currentStep > 0 && (
                            <Button 
                                variant="outline" 
                                onClick={prevStep}
                                className="flex-1 py-5 rounded-xl text-sm font-semibold border-border/60 hover:bg-accent/40"
                            >
                                <ChevronLeft className="size-4 mr-1.5" /> Trước
                            </Button>
                        )}
                        <Button 
                            onClick={nextStep}
                            className="flex-1 py-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white transition-opacity"
                        >
                            {currentStep === steps.length - 1 ? "Bắt đầu ngay ✨" : <>Tiếp theo <ChevronRight className="size-4 ml-1.5" /></>}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
