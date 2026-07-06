import SEO from "@/components/common/SEO";

export default function ExplorePage() {
    return (
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
            <SEO title="Khám phá" description="Khám phá các bài viết nổi bật, xu hướng và những thành viên mới trên cộng đồng NewJourney." />
            <h1 className="text-2xl font-bold">Khám phá</h1>
            <p className="text-muted-foreground mt-2">Đang tải nội dung khám phá...</p>
        </div>
    );
}
