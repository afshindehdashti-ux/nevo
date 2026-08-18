import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  ImageIcon,
  Loader2,
  RotateCcw,
  Search,
  Upload,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import slotCatalogue from "@/data/image-slots.json";
import { assetPathToUrl } from "@/lib/image-registry";
import {
  fetchAllOverrides,
  overrideUrl,
  type ImageOverride,
} from "@/lib/image-overrides";

type Slot = {
  assetPath: string;
  assetKey: string;
  folder: string;
  intrinsic: string;
  kb: number;
  slot: string;
  required: string;
  routes: string[];
  components: string[];
  alt: string;
};

const SLOTS = (slotCatalogue as { slots: Slot[] }).slots;
const FOLDERS = Array.from(new Set(SLOTS.map((s) => s.folder))).sort();
const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const Route = createFileRoute("/_authenticated/admin/images")({
  head: () => ({
    meta: [
      { title: "Image Library — NEVO Admin" },
      {
        name: "description",
        content:
          "Replace website photography slot by slot: upload a licensed image, record its licence, and publish without a code change.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminImagesPage,
});

function requiredPixels(required: string): { w: number; h: number } | null {
  const match = required.match(/(\d+)x(\d+)/);
  return match ? { w: Number(match[1]), h: Number(match[2]) } : null;
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image file."));
    };
    img.src = url;
  });
}

function AdminImagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("all");
  const [status, setStatus] = useState<"all" | "replaced" | "original">("all");
  const [active, setActive] = useState<Slot | null>(null);
  const [revertTarget, setRevertTarget] = useState<{ slot: Slot; row: ImageOverride } | null>(null);

  const overridesQuery = useQuery({
    queryKey: ["image-slot-overrides", "all"],
    queryFn: fetchAllOverrides,
  });

  const byPath = useMemo(() => {
    const map = new Map<string, ImageOverride>();
    for (const row of overridesQuery.data ?? []) map.set(row.asset_path, row);
    return map;
  }, [overridesQuery.data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return SLOTS.filter((s) => {
      if (folder !== "all" && s.folder !== folder) return false;
      const replaced = byPath.has(s.assetPath);
      if (status === "replaced" && !replaced) return false;
      if (status === "original" && replaced) return false;
      if (!term) return true;
      return (
        s.assetPath.toLowerCase().includes(term) ||
        s.alt.toLowerCase().includes(term) ||
        s.slot.toLowerCase().includes(term) ||
        s.routes.join(" ").toLowerCase().includes(term)
      );
    });
  }, [search, folder, status, byPath]);

  const revertMutation = useMutation({
    mutationFn: async ({ row }: { slot: Slot; row: ImageOverride }) => {
      await supabase.storage.from("site-images").remove([row.storage_path]);
      const { error } = await supabase.from("image_slot_overrides").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reverted to the original image.");
      void queryClient.invalidateQueries({ queryKey: ["image-slot-overrides"] });
      setRevertTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const replacedCount = byPath.size;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Image library</h1>
        <p className="text-sm text-muted-foreground">
          Every image slot on the website. Upload a licensed photo into a slot and it goes live
          everywhere that slot appears — no code change, no deploy.
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{replacedCount}</span> of {SLOTS.length}{" "}
          slots replaced with sourced photography.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="image-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="image-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="File name, page, alt text…"
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 md:w-56">
            <Label htmlFor="image-folder">Area</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger id="image-folder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas</SelectItem>
                {FOLDERS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:w-48">
            <Label htmlFor="image-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="image-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All slots</SelectItem>
                <SelectItem value="replaced">Replaced</SelectItem>
                <SelectItem value="original">Not yet replaced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {visible.length} slot{visible.length === 1 ? "" : "s"}
        {overridesQuery.isFetching ? " · updating…" : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((slot) => {
          const row = byPath.get(slot.assetPath);
          const preview = row
            ? overrideUrl(row.storage_path, row.updated_at)
            : assetPathToUrl[slot.assetPath];
          return (
            <Card key={slot.assetPath} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {preview ? (
                  <img
                    src={preview}
                    alt={slot.alt || slot.assetPath}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" aria-hidden />
                  </div>
                )}
                <Badge
                  variant={row ? "default" : "secondary"}
                  className="absolute end-2 top-2 gap-1"
                >
                  {row ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" aria-hidden /> Replaced
                    </>
                  ) : (
                    <>
                      <TriangleAlert className="h-3 w-3" aria-hidden /> Original
                    </>
                  )}
                </Badge>
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="truncate text-sm font-medium" title={slot.assetPath}>
                  {slot.assetPath.replace("src/assets/", "")}
                </p>
                <dl className="space-y-1 text-xs text-muted-foreground">
                  <div>
                    <dt className="inline font-medium text-foreground">Slot: </dt>
                    <dd className="inline">{slot.slot}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Required: </dt>
                    <dd className="inline">{slot.required}</dd>
                  </div>
                  <div className="truncate" title={slot.routes.join(", ")}>
                    <dt className="inline font-medium text-foreground">Pages: </dt>
                    <dd className="inline">{slot.routes.join(", ") || "—"}</dd>
                  </div>
                </dl>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="gap-1.5" onClick={() => setActive(slot)}>
                    <Upload className="h-3.5 w-3.5" aria-hidden />
                    {row ? "Replace again" : "Upload"}
                  </Button>
                  {row ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setRevertTarget({ slot, row })}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Revert
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No slots match these filters.
        </p>
      ) : null}

      <UploadDialog
        slot={active}
        existing={active ? byPath.get(active.assetPath) : undefined}
        onClose={() => setActive(null)}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ["image-slot-overrides"] });
          setActive(null);
        }}
      />

      <AlertDialog
        open={Boolean(revertTarget)}
        onOpenChange={(open) => !open && setRevertTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to the original image?</AlertDialogTitle>
            <AlertDialogDescription>
              The uploaded photo will be deleted and every page using this slot goes back to the
              built-in image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revertTarget && revertMutation.mutate(revertTarget)}
              disabled={revertMutation.isPending}
            >
              {revertMutation.isPending ? "Reverting…" : "Revert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UploadDialog({
  slot,
  existing,
  onClose,
  onSaved,
}: {
  slot: Slot | null;
  existing?: ImageOverride;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [credit, setCredit] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setSize(null);
    setPreview(null);
    setSource("");
    setLicenseType("");
    setLicenseId("");
    setCredit("");
    setNotes("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const target = slot ? requiredPixels(slot.required) : null;
  const tooSmall =
    target && size ? size.width < target.w * 0.9 || size.height < target.h * 0.9 : false;

  const handleFile = async (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      setError("Use a JPG, PNG, WebP or AVIF file.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("File is larger than 12 MB. Export a compressed version first.");
      return;
    }
    try {
      const dimensions = await readImageSize(picked);
      setFile(picked);
      setSize(dimensions);
      setPreview(URL.createObjectURL(picked));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!slot || !file || !size) throw new Error("Choose an image first.");
      if (!source.trim() || !licenseType.trim() || !licenseId.trim()) {
        throw new Error("Source, licence type and licence ID are required.");
      }
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${slot.assetPath.replace(/^src\/assets\//, "").replace(/\.[^.]+$/, "")}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: auth } = await supabase.auth.getUser();
      const { error: saveError } = await supabase.from("image_slot_overrides").upsert(
        {
          asset_path: slot.assetPath,
          asset_key: slot.assetKey,
          storage_path: storagePath,
          width: size.width,
          height: size.height,
          content_type: file.type,
          byte_size: file.size,
          license_source: source.trim(),
          license_type: licenseType.trim(),
          license_id: licenseId.trim(),
          license_credit: credit.trim() || null,
          notes: notes.trim() || null,
          is_active: true,
          uploaded_by: auth.user?.id ?? null,
        },
        { onConflict: "asset_path" },
      );
      if (saveError) throw saveError;

      if (existing?.storage_path && existing.storage_path !== storagePath) {
        await supabase.storage.from("site-images").remove([existing.storage_path]);
      }
    },
    onSuccess: () => {
      toast.success("Image published to this slot.");
      reset();
      onSaved();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog
      open={Boolean(slot)}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Replace image</DialogTitle>
          <DialogDescription>
            {slot ? (
              <>
                {slot.assetPath.replace("src/assets/", "")} · {slot.slot} · deliver{" "}
                <strong>{slot.required}</strong>
                {slot.routes.length ? <> · used on {slot.routes.join(", ")}</> : null}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="image-file">Image file</Label>
            <Input
              id="image-file"
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP or AVIF · up to 12 MB · target {slot?.required}
            </p>
          </div>

          {preview ? (
            <div className="space-y-1.5">
              <div className="overflow-hidden rounded-md border border-border">
                <img src={preview} alt="Upload preview" className="aspect-video w-full object-cover" />
              </div>
              <p className={`text-xs ${tooSmall ? "text-destructive" : "text-muted-foreground"}`}>
                {size ? `${size.width}x${size.height}px` : ""}
                {tooSmall ? " — smaller than the slot needs; it will look soft." : " — good for this slot."}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="image-source">Source *</Label>
              <Input
                id="image-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Getty Images, in-house shoot…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image-license-type">Licence type *</Label>
              <Input
                id="image-license-type"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                placeholder="Royalty-free, commercial"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image-license-id">Licence / order ID *</Label>
              <Input
                id="image-license-id"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                placeholder="GI-1234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image-credit">Credit</Label>
              <Input
                id="image-credit"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="Photographer / agency"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image-notes">Notes</Label>
            <Textarea
              id="image-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Usage restrictions, expiry, shoot reference…"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => upload.mutate()}
            disabled={!file || upload.isPending}
            className="gap-1.5"
          >
            {upload.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Publishing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden /> Publish to slot
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
