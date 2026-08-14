import { useRef, useState } from "react";
import { X, Camera, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VirtualTryOnProps {
  productName: string;
  shoeImageUrl: string;
}

export function VirtualTryOn({ productName, shoeImageUrl }: VirtualTryOnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "loading" | "result" | "error">("upload");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!previewUrl) return;
    setStep("loading");
    try {
      const mime = previewUrl.slice(5, previewUrl.indexOf(";"));
      const base64Data = previewUrl.split(",")[1];
      const res = await fetch("/api/virtual-try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_image_base64: base64Data,
          person_image_mime: mime,
          shoe_image_url: shoeImageUrl,
          product_name: productName,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result_image) {
        throw new Error(data?.error || "Erro ao gerar imagem.");
      }
      setResultImage(data.result_image);
      setStep("result");
    } catch (err: any) {
      setErrorMsg(err?.message || "Não foi possível processar sua foto. Tente novamente.");
      setStep("error");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setPreviewUrl(null);
    setResultImage(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `try-on-${productName.replace(/\s/g, "-")}.png`;
    link.click();
  };

  if (!isOpen) {
    return (
      <div className="mt-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold transition-all hover:border-foreground/40"
        >
          👟 Experimentar virtualmente
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          🔒 Sua foto é processada e descartada imediatamente. Não armazenamos imagens.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-background sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Provador Virtual</h3>
            <p className="text-xs text-muted-foreground">{productName}</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              handleReset();
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envie uma foto sua (corpo inteiro ou só os pés) e veja como o tênis fica em você!
              </p>

              {previewUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <img src={previewUrl} alt="Sua foto" className="max-h-72 w-full object-contain" />
                  <button
                    onClick={handleReset}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                    aria-label="Remover foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center hover:border-foreground/40"
                >
                  <Camera className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Toque para enviar sua foto</p>
                  <p className="text-xs text-muted-foreground">JPG ou PNG, máx 5MB</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Dicas para um resultado melhor:</p>
                <p>• Foto de corpo inteiro ou dos pés visíveis</p>
                <p>• Boa iluminação, sem sombras fortes</p>
                <p>• Fundo neutro (chão, calçada, parede)</p>
              </div>

              <button
                onClick={handleTryOn}
                disabled={!previewUrl}
                className="w-full rounded-xl bg-foreground py-3 text-sm font-bold text-background disabled:opacity-40"
              >
                Experimentar agora →
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                🔒 Sua foto é processada e descartada imediatamente. Não armazenamos imagens.
              </p>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Processando seu look...</p>
              <p className="text-xs text-muted-foreground">Isso pode levar até 30 segundos</p>
            </div>
          )}

          {step === "result" && resultImage && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">✅ Pronto! Veja como ficou:</p>
              <img src={resultImage} alt="Resultado do provador virtual" className="w-full rounded-xl" />
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold"
                >
                  Tentar outra foto
                </button>
                <button
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" /> Salvar foto
                </button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="text-3xl">😕</span>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {step === "result" && (
          <div className="border-t border-border p-4">
            <button
              onClick={() => {
                setIsOpen(false);
                document.querySelector("[data-buy-button]")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full rounded-xl bg-[#25d366] py-3 font-bold text-white"
            >
              Gostei! Quero comprar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
