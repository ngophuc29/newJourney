import React, { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isOwn?: boolean;
}

const AudioPlayer = ({ src, duration, isOwn }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Lỗi khi phát audio:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration || duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * totalDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = () => {
    setPlaybackRate((prev) => {
      const nextRate = prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1;
      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
      }
      return nextRate;
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Render a mock waveform of 18 bars
  const bars = Array.from({ length: 18 }, (_, i) => {
    const height = 15 + Math.sin(i * 0.5) * 10 + Math.cos(i * 0.2) * 5;
    return {
      height: `${Math.max(6, height)}px`,
    };
  });

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl p-2.5 min-w-[240px] max-w-xs transition-colors",
        isOwn ? "bg-white/15 text-white" : "bg-muted/60 text-foreground"
      )}
    >
      {/* Hidden Native HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Play/Pause Button */}
      <Button
        type="button"
        size="icon-sm"
        onClick={togglePlay}
        className={cn(
          "shrink-0 rounded-full",
          isOwn
            ? "bg-white text-primary hover:bg-white/95"
            : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current ml-0.5" />
        )}
      </Button>

      {/* Waveform & Progress */}
      <div className="flex flex-col flex-1 gap-1.5 min-w-0">
        {/* Animated Waveform */}
        <div className="flex items-end gap-[3px] h-8 px-1">
          {bars.map((bar, index) => (
            <div
              key={index}
              style={{
                height: bar.height,
              }}
              className={cn(
                "w-[3px] rounded-full transition-all duration-300",
                isPlaying ? "animate-audio-bar" : "",
                isOwn ? "bg-white/40" : "bg-primary/30",
                // Highlight played portion
                progressPercent > (index / bars.length) * 100
                  ? isOwn
                    ? "bg-white"
                    : "bg-primary"
                  : ""
              )}
            />
          ))}
        </div>

        {/* Progress Slider Bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="relative h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 cursor-pointer overflow-hidden"
        >
          <div
            style={{ width: `${progressPercent}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-75",
              isOwn ? "bg-white" : "bg-primary"
            )}
          />
        </div>

        {/* Time Labels */}
        <div className="flex justify-between text-[10px] opacity-75">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Speed Control Button */}
      <button
        type="button"
        onClick={changeSpeed}
        className={cn(
          "shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border transition-all flex items-center gap-0.5",
          isOwn
            ? "border-white/20 hover:bg-white/10 text-white"
            : "border-border hover:bg-muted text-muted-foreground"
        )}
        title="Tốc độ phát"
      >
        <span>{playbackRate}x</span>
      </button>
    </div>
  );
};

export default AudioPlayer;
