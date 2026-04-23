import { useEffect, useRef, useState } from "react";
import { getYoutubeEmbed, type VideoType } from "@/lib/video";
import { cn } from "@/lib/utils";

export type ShoppableTag = {
  id: string;
  product_id: string;
  position_x: number;
  position_y: number;
  timestamp_start: number | null;
  timestamp_end: number | null;
};

type Props = {
  videoUrl: string;
  videoType: VideoType;
  tags: ShoppableTag[];
  mode: "edit" | "view";
  onTagMove?: (id: string, x: number, y: number) => void;
  onTagClick?: (tag: ShoppableTag) => void;
  selectedTagId?: string | null;
  className?: string;
};

export function ShoppableVideo({
  videoUrl,
  videoType,
  tags,
  mode,
  onTagMove,
  onTagClick,
  selectedTagId,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoUrl]);

  // For YouTube, tags always visible (no IFrame API). For mp4/upload, sync with currentTime.
  const isVisible = (t: ShoppableTag) => {
    if (videoType === "youtube") return true;
    const start = t.timestamp_start ?? 0;
    const end = t.timestamp_end;
    if (currentTime < start) return false;
    if (end != null && currentTime > end) return false;
    return true;
  };

  function handlePointerDown(e: React.PointerEvent, tagId: string) {
    if (mode !== "edit") return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(tagId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (mode !== "edit" || !draggingId || !containerRef.current || !onTagMove) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const cx = Math.max(0, Math.min(100, x));
    const cy = Math.max(0, Math.min(100, y));
    onTagMove(draggingId, cx, cy);
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-video overflow-hidden rounded-xl bg-black", className)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {videoType === "youtube" ? (
        <iframe
          src={getYoutubeEmbed(videoUrl) ?? ""}
          className="h-full w-full"
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          controls={mode === "view"}
          playsInline
          muted={mode === "edit"}
          loop={mode === "edit"}
          autoPlay={mode === "edit"}
          className="h-full w-full object-contain"
        />
      )}

      {/* Tag overlay */}
      <div className={cn("absolute inset-0", mode === "view" && "pointer-events-none")}>
        {tags.filter(isVisible).map((t, i) => {
          const selected = selectedTagId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onPointerDown={(e) => handlePointerDown(e, t.id)}
              onClick={(e) => {
                if (mode === "edit") return;
                e.stopPropagation();
                onTagClick?.(t);
              }}
              onKeyDown={(e) => {
                if (mode !== "view") return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onTagClick?.(t);
                }
              }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
                "flex h-6 w-6 items-center justify-center rounded-full",
                "bg-white shadow-lg ring-2 ring-white/80",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-accent",
                mode === "edit" ? "cursor-move" : "cursor-pointer hover:scale-125",
                "transition-transform",
                selected && "ring-4 ring-accent",
              )}
              style={{ left: `${t.position_x}%`, top: `${t.position_y}%` }}
              aria-label={`Ver produto marcado na posição ${i + 1}`}
            >
              <span className="block h-2.5 w-2.5 animate-ping rounded-full bg-accent absolute" aria-hidden="true" />
              <span className="block h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
