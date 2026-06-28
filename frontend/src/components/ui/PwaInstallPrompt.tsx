import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Ngăn chặn trình duyệt tự động hiển thị prompt
      e.preventDefault();
      // Lưu lại event để kích hoạt sau
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Kiểm tra xem đã cài đặt chưa
    window.addEventListener("appinstalled", () => {
      console.log("PWA installed successfully");
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Hiển thị prompt cài đặt
    await deferredPrompt.prompt();

    // Chờ phản hồi từ người dùng
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Dọn dẹp
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Download className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Cài đặt New Journey</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Cài đặt ứng dụng lên màn hình chính để nhắn tin nhanh hơn và nhận thông báo tức thì!
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              size="xs"
              onClick={handleInstallClick}
              className="bg-primary hover:bg-primary-hover text-white text-[11px]"
            >
              Cài đặt ngay
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={handleDismiss}
              className="text-[11px]"
            >
              Để sau
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
