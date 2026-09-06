import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

function split(diff: number) {
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s };
}

export function PromoTimer({
  endsAt,
  label,
  size = "sm",
  onExpire,
  className,
}: {
  endsAt: string;
  label?: string | null;
  size?: "sm" | "lg";
  onExpire?: () => void;
  className?: string;
}) {
  const [left, setLeft] = useState<ReturnType<typeof split> | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let fired = false;
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        if (!fired) {
          fired = true;
          onExpire?.();
        }
        return;
      }
      setLeft(split(diff));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt, onExpire]);

  if (expired || !left) return null;

  const box = cn(
    "rounded-md bg-gray-900 text-center font-mono text-white",
    size === "lg" ? "min-w-[40px] px-2 py-1 text-base" : "min-w-[28px] px-1.5 py-0.5 text-xs",
  );
  const sep = cn("font-bold text-gray-400", size === "lg" ? "text-base" : "text-xs");
  const parts: string[] = [];
  if (left.d > 0) parts.push(`${left.d}d`);
  if (left.d > 0 || left.h > 0) parts.push(pad(left.h));
  parts.push(pad(left.m), pad(left.s));

  return (
    <div className={cn("mt-1.5", className)} aria-live="off">
      {label && <p className={cn("mb-1 text-gray-500", size === "lg" ? "text-sm" : "text-xs")}>{label}</p>}
      <div className="flex items-center gap-1">
        {parts.map((v, i) => (
          <span key={i} className="contents">
            {i > 0 && <span className={sep}>:</span>}
            <span className={box}>{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
