import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ImageUpload({
  bucket,
  storeId,
  value,
  onChange,
  className = "",
  label = "Enviar imagem",
  aspect = "aspect-square",
}: {
  bucket: "products" | "categories" | "banners" | "logo";
  storeId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${storeId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className={`relative ${aspect} w-full overflow-hidden rounded-lg border border-border bg-muted`}>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className={`flex ${aspect} w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-accent hover:bg-muted/50`}>
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

export function MultiImageUpload({
  bucket,
  storeId,
  images,
  onChange,
  max = 6,
}: {
  bucket: "products";
  storeId: string;
  images: { url: string; position: number }[];
  onChange: (images: { url: string; position: number }[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const slots = max - images.length;
    if (slots <= 0) {
      toast.error(`Máximo ${max} imagens`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: { url: string; position: number }[] = [];
      let pos = images.length;
      for (const file of files.slice(0, slots)) {
        const ext = file.name.split(".").pop();
        const path = `${storeId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, position: pos++ });
      }
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} imagem(s) enviada(s)`);
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function remove(idx: number) {
    const next = images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, position: i }));
    onChange(next);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((img, i) => ({ ...img, position: i })));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {images.map((img, i) => (
          <div key={i} className="product-image-card group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remover imagem"
              className="image-delete-btn"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="image-reorder">
              <button type="button" onClick={() => move(i, -1)} aria-label="Mover para a esquerda" data-disabled={i === 0}>←</button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Mover para a direita" data-disabled={i === images.length - 1}>→</button>
            </div>
          </div>
        ))}
        {images.length < max && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-accent">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
            <span className="text-[10px] text-muted-foreground">{images.length}/{max}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}
