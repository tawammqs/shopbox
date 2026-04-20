import { useMemo, useState } from "react";
import { Plus, X, GripVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ColorRow = { id?: string; name: string; hex: string; position: number };
export type SizeRow = { id?: string; label: string; position: number };

type PropertyKind = "size" | "color" | "material" | "custom";

const SIZE_PRESETS: Record<string, string[]> = {
  Adultos: ["PP", "P", "M", "G", "GG", "XG", "XXG"],
  Crianças: ["2", "4", "6", "8", "10", "12", "14"],
  Calçados: Array.from({ length: 43 - 13 + 1 }, (_, i) => String(13 + i)),
};

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Preto", hex: "#000000" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Cinza", hex: "#9CA3AF" },
  { name: "Vermelho", hex: "#DC2626" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Laranja", hex: "#F97316" },
  { name: "Amarelo", hex: "#FACC15" },
  { name: "Verde", hex: "#16A34A" },
  { name: "Azul", hex: "#2563EB" },
  { name: "Marinho", hex: "#1E3A8A" },
  { name: "Roxo", hex: "#7C3AED" },
  { name: "Marrom", hex: "#78350F" },
  { name: "Bege", hex: "#D6B98C" },
  { name: "Dourado", hex: "#D4AF37" },
  { name: "Prata", hex: "#C0C0C0" },
];

interface Props {
  colors: ColorRow[];
  sizes: SizeRow[];
  onColorsChange: (next: ColorRow[]) => void;
  onSizesChange: (next: SizeRow[]) => void;
}

export function VariationsBuilder({ colors, sizes, onColorsChange, onSizesChange }: Props) {
  const [openModal, setOpenModal] = useState<PropertyKind | null>(null);

  const hasColor = colors.length > 0;
  const hasSize = sizes.length > 0;
  const totalProps = (hasColor ? 1 : 0) + (hasSize ? 1 : 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Combine diferentes propriedades do seu produto. Exemplo: cor + tamanho.
      </p>

      {hasColor && (
        <PropertyCard
          title="Cor"
          count={colors.length}
          onEdit={() => setOpenModal("color")}
          onRemove={() => onColorsChange([])}
        >
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs"
              >
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ background: c.hex }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </PropertyCard>
      )}

      {hasSize && (
        <PropertyCard
          title="Tamanho"
          count={sizes.length}
          onEdit={() => setOpenModal("size")}
          onRemove={() => onSizesChange([])}
        >
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium"
              >
                {s.label}
              </span>
            ))}
          </div>
        </PropertyCard>
      )}

      {totalProps < 2 && (
        <AddPropertyLauncher
          hasColor={hasColor}
          hasSize={hasSize}
          onPick={(kind) => setOpenModal(kind)}
        />
      )}

      <SizePropertyModal
        open={openModal === "size"}
        initial={sizes}
        onOpenChange={(o) => !o && setOpenModal(null)}
        onSave={(next) => {
          onSizesChange(next);
          setOpenModal(null);
        }}
      />
      <ColorPropertyModal
        open={openModal === "color"}
        initial={colors}
        onOpenChange={(o) => !o && setOpenModal(null)}
        onSave={(next) => {
          onColorsChange(next);
          setOpenModal(null);
        }}
      />
    </div>
  );
}

function PropertyCard({
  title,
  count,
  children,
  onEdit,
  onRemove,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2 text-xs">
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove} className="h-7 w-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function AddPropertyLauncher({
  hasColor,
  hasSize,
  onPick,
}: {
  hasColor: boolean;
  hasSize: boolean;
  onPick: (k: PropertyKind) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Adicionar variações
        </button>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-semibold">Nova propriedade</Label>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Propriedade</Label>
          <Select
            onValueChange={(v) => {
              setOpen(false);
              onPick(v as PropertyKind);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              {!hasSize && <SelectItem value="size">Tamanho</SelectItem>}
              {!hasColor && <SelectItem value="color">Cor</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function SizePropertyModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: SizeRow[];
  onSave: (next: SizeRow[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [newCustom, setNewCustom] = useState("");

  useMemo(() => {
    if (open) {
      const presetLabels = new Set(Object.values(SIZE_PRESETS).flat());
      setSelected(initial.filter((s) => presetLabels.has(s.label)).map((s) => s.label));
      setCustom(initial.filter((s) => !presetLabels.has(s.label)).map((s) => s.label));
      setNewCustom("");
    }
  }, [open]);

  const toggle = (label: string) =>
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );

  const toggleAll = (group: string[]) => {
    const allIn = group.every((g) => selected.includes(g));
    setSelected((prev) =>
      allIn ? prev.filter((x) => !group.includes(x)) : Array.from(new Set([...prev, ...group])),
    );
  };

  const addCustom = () => {
    const v = newCustom.trim();
    if (!v || custom.includes(v) || selected.includes(v)) return;
    setCustom([...custom, v]);
    setNewCustom("");
  };

  const handleSave = () => {
    const all = [...custom, ...selected];
    onSave(all.map((label, i) => ({ label, position: i })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>Nova propriedade</DialogTitle>
          <DialogDescription>Selecione os tamanhos do produto.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-4">
          <div>
            <Label className="text-xs text-muted-foreground">Propriedade</Label>
            <div className="mt-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
              Tamanho
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Tamanhos personalizados</p>
            <p className="mb-2 text-xs text-muted-foreground">
              Adicione tamanhos que não estão na lista abaixo.
            </p>
            <div className="space-y-1.5">
              {custom.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={c}
                    onChange={(e) => {
                      const next = [...custom];
                      next[i] = e.target.value;
                      setCustom(next);
                    }}
                    className="h-9"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCustom(custom.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ex: U (Único)"
                  value={newCustom}
                  onChange={(e) => setNewCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  className="h-9"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustom}>
                  <Plus className="mr-1 h-3 w-3" /> Adicionar
                </Button>
              </div>
            </div>
          </div>

          {Object.entries(SIZE_PRESETS).map(([group, labels]) => {
            const allIn = labels.every((l) => selected.includes(l));
            return (
              <div key={group}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold">{group}</p>
                  <button
                    type="button"
                    onClick={() => toggleAll(labels)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {allIn ? "Desmarcar tudo" : "Selecionar tudo"}
                  </button>
                </div>
                <div className="divide-y divide-border rounded-md border border-border">
                  {labels.map((label) => (
                    <label
                      key={label}
                      className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/40"
                    >
                      <span>{label}</span>
                      <Checkbox
                        checked={selected.includes(label)}
                        onCheckedChange={() => toggle(label)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorPropertyModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ColorRow[];
  onSave: (next: ColorRow[]) => void;
}) {
  const [selected, setSelected] = useState<ColorRow[]>([]);
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#000000");

  useMemo(() => {
    if (open) {
      setSelected(initial.map((c, i) => ({ ...c, position: i })));
      setCustomName("");
      setCustomHex("#000000");
    }
  }, [open]);

  const isSelected = (name: string) => selected.some((s) => s.name === name);
  const togglePreset = (preset: { name: string; hex: string }) => {
    setSelected((prev) =>
      isSelected(preset.name)
        ? prev.filter((s) => s.name !== preset.name)
        : [...prev, { ...preset, position: prev.length }],
    );
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name || isSelected(name)) return;
    setSelected([...selected, { name, hex: customHex, position: selected.length }]);
    setCustomName("");
    setCustomHex("#000000");
  };

  const handleSave = () => {
    onSave(selected.map((c, i) => ({ ...c, position: i })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>Nova propriedade</DialogTitle>
          <DialogDescription>Selecione as cores do produto.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-4">
          <div>
            <Label className="text-xs text-muted-foreground">Propriedade</Label>
            <div className="mt-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
              Cor
            </div>
          </div>

          {selected.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Cores selecionadas</p>
              <div className="space-y-1.5">
                {selected.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => {
                        const next = [...selected];
                        next[i] = { ...next[i], hex: e.target.value };
                        setSelected(next);
                      }}
                      className="h-7 w-9 cursor-pointer rounded border border-border"
                    />
                    <Input
                      value={c.name}
                      onChange={(e) => {
                        const next = [...selected];
                        next[i] = { ...next[i], name: e.target.value };
                        setSelected(next);
                      }}
                      className="h-8"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelected(selected.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold">Adicionar cor personalizada</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-border"
              />
              <Input
                placeholder="Nome da cor"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                className="h-9"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustom}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Cores comuns</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {COLOR_PRESETS.map((p) => {
                const active = isSelected(p.name);
                return (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => togglePreset(p)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ background: p.hex }}
                    />
                    <span className="flex-1 truncate">{p.name}</span>
                    {active && <span className="text-primary">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
