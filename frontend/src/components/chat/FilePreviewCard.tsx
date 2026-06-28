import { cn } from "@/lib/utils";
import { Download, FileText, FileArchive, FileSpreadsheet, FileImage, Film, File } from "lucide-react";
import { Button } from "../ui/button";

interface FilePreviewCardProps {
    fileName: string;
    fileSize?: number | null;
    mediaUrl: string;
    isOwn?: boolean;
    compact?: boolean; // For input preview mode
}

const FILE_ICONS: Record<string, { icon: typeof File; color: string }> = {
    pdf: { icon: FileText, color: "text-red-500" },
    doc: { icon: FileText, color: "text-blue-500" },
    docx: { icon: FileText, color: "text-blue-500" },
    xls: { icon: FileSpreadsheet, color: "text-green-500" },
    xlsx: { icon: FileSpreadsheet, color: "text-green-500" },
    csv: { icon: FileSpreadsheet, color: "text-green-600" },
    zip: { icon: FileArchive, color: "text-amber-500" },
    rar: { icon: FileArchive, color: "text-amber-500" },
    "7z": { icon: FileArchive, color: "text-amber-500" },
    tar: { icon: FileArchive, color: "text-amber-600" },
    gz: { icon: FileArchive, color: "text-amber-600" },
    png: { icon: FileImage, color: "text-purple-500" },
    jpg: { icon: FileImage, color: "text-purple-500" },
    jpeg: { icon: FileImage, color: "text-purple-500" },
    gif: { icon: FileImage, color: "text-purple-500" },
    svg: { icon: FileImage, color: "text-purple-500" },
    mp4: { icon: Film, color: "text-pink-500" },
    mov: { icon: Film, color: "text-pink-500" },
    avi: { icon: Film, color: "text-pink-500" },
    ppt: { icon: FileText, color: "text-orange-500" },
    pptx: { icon: FileText, color: "text-orange-500" },
    txt: { icon: FileText, color: "text-gray-500" },
};

const getFileExtension = (fileName: string): string => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDownloadUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
        // Inject fl_attachment flag to force browser download
        return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
};

const FilePreviewCard = ({
    fileName,
    fileSize,
    mediaUrl,
    isOwn,
    compact,
}: FilePreviewCardProps) => {
    const ext = getFileExtension(fileName);
    const fileConfig = FILE_ICONS[ext] || { icon: File, color: "text-muted-foreground" };
    const Icon = fileConfig.icon;

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(mediaUrl, "_self");
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
                <Icon className={cn("size-6 shrink-0", fileConfig.color)} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{fileName}</p>
                    {fileSize && (
                        <p className="text-[10px] text-muted-foreground">{formatFileSize(fileSize)}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-lg p-2 transition-colors cursor-pointer",
                isOwn
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-muted/50 hover:bg-muted"
            )}
            onClick={handleDownload}
        >
            <div className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                isOwn ? "bg-white/20" : "bg-background"
            )}>
                <Icon className={cn("size-5", isOwn ? "text-white" : fileConfig.color)} />
            </div>

            <div className="min-w-0 flex-1">
                <p className={cn(
                    "truncate text-sm font-medium",
                    isOwn ? "text-white" : "text-foreground"
                )}>
                    {fileName}
                </p>
                <div className="flex items-center gap-2">
                    {fileSize && (
                        <span className={cn(
                            "text-[11px]",
                            isOwn ? "text-white/60" : "text-muted-foreground"
                        )}>
                            {formatFileSize(fileSize)}
                        </span>
                    )}
                    <span className={cn(
                        "text-[11px] uppercase",
                        isOwn ? "text-white/50" : "text-muted-foreground"
                    )}>
                        {ext}
                    </span>
                </div>
            </div>

            <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className={cn(
                    "shrink-0",
                    isOwn ? "text-white/70 hover:text-white hover:bg-white/20" : ""
                )}
                onClick={handleDownload}
                title="Tải xuống"
            >
                <Download className="size-3.5" />
            </Button>
        </div>
    );
};

export default FilePreviewCard;
