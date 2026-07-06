import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Hammer } from "lucide-react";

export default function ExplorePage() {
    const navigate = useNavigate();

    return (
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center bg-background">
            <SEO title="Khám phá" description="Khám phá các bài viết nổi bật, xu hướng và những thành viên mới trên cộng đồng NewJourney." />
            
            <div className="max-w-md w-full bg-card/60 backdrop-blur-md border border-border/40 rounded-3xl p-8 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/* Gif Container */}
                <div className="relative size-40 rounded-2xl overflow-hidden mb-6 border border-border/30 shadow-md">
                    <img 
                        src="https://i.pinimg.com/originals/b9/e4/96/b9e4960c1476c78043d499d975f86cdb.gif" 
                        alt="Tính năng đang phát triển" 
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex items-center gap-2 mb-2 text-violet-500">
                    <Hammer className="size-5 animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-wider">Under Construction</span>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-3 font-semibold">Tính năng đang phát triển</h1>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Trang Khám phá đang được hoàn thiện hệ thống gợi ý bài viết thông minh và sẽ sớm ra mắt trong phiên bản tiếp theo. Vui lòng quay lại sau nhé!
                </p>

                <Button 
                    onClick={() => navigate("/")}
                    className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white"
                >
                    Quay lại Bảng tin
                </Button>
            </div>
        </div>
    );
}
