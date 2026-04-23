import { useRef, useState } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  type VideoType,
  getYoutubeEmbed,
  VIDEO_ACCEPT,
  VIDEO_ALLOWED_TYPES,
  VIDEO_UPLOAD_MAX_BYTES,
} from "@/lib/video";

type Props = {
  storeId: string;
  videoUrl: string | null;
  videoType: VideoType | null;
  onChange: (val: { url: string | null; type: VideoType | null }) => void;
};

export function VideoSourcePicker({ storeId, videoUrl, videoType, onChange }: Props) {
  const [tab, setTab] = useState<VideoType>(videoType ?? "upload");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!VIDEO_ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use MP4, MOV ou WebM.");
      return;
    }
    if (file.size > VIDEO_UPLOAD_MAX_BYTES) {
      toast.error("Vídeo maior que 100MB. Reduza ou use YouTube.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-videos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-videos").getPublicUrl(path);
      onChange({ url: data.publicUrl, type: "upload" });
      toast.success("Vídeo enviado!");
    } catch (e: any) {
      toast.error(e.message ?? "Erro no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clear() {
    onChange({ url: null, type: null });
  }

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => setTab(v as VideoType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="mp4">Link MP4</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={VIDEO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Selecionar vídeo (MP4/MOV/WebM, até 100MB)</>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="mp4" className="space-y-2">
          <Label className="text-xs">URL direta de arquivo .mp4</Label>
          <Input
            placeholder="https://.../video.mp4"
            value={videoType === "mp4" ? videoUrl ?? "" : ""}
            onChange={(e) => onChange({ url: e.target.value || null, type: e.target.value ? "mp4" : null })}
          />
        </TabsContent>

        <TabsContent value="youtube" className="space-y-2">
          <Label className="text-xs">Link do YouTube</Label>
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoType === "youtube" ? videoUrl ?? "" : ""}
            onChange={(e) => onChange({ url: e.target.value || null, type: e.target.value ? "youtube" : null })}
          />
        </TabsContent>
      </Tabs>

      {videoUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pré-visualização</p>
            <Button type="button" size="sm" variant="ghost" onClick={clear}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
            </Button>
          </div>
          <VideoPreview url={videoUrl} type={videoType} />
        </div>
      )}
    </div>
  );
}

export function VideoPreview({ url, type }: { url: string; type: VideoType | null }) {
  if (type === "youtube") {
    const embed = getYoutubeEmbed(url);
    if (!embed) return <p className="text-xs text-destructive">URL do YouTube inválida</p>;
    return (
      <div className="aspect-video overflow-hidden rounded-lg bg-black">
        <iframe src={embed} className="h-full w-full" allowFullScreen allow="accelerometer; autoplay; encrypted-media; picture-in-picture" />
      </div>
    );
  }
  return (
    <div className="aspect-video overflow-hidden rounded-lg bg-black">
      <video src={url} controls className="h-full w-full" playsInline />
    </div>
  );
}
