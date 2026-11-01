"use client";

import { useId, useRef, useState } from "react";
import { Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { processImage, type ImageKind } from "@/lib/image";
import { Button } from "./Button";
import { FieldError } from "./Field";

export interface ImageUploaderProps {
  label: string;
  kind: ImageKind;
  /** Data URL of the current image, or null. */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  helper?: string;
  disabled?: boolean;
}

/** Pick an image, resize it to max 800px, preview it, replace or remove it. */
export function ImageUploader({ label, kind, value, onChange, helper, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Choose a PNG or JPG.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await processImage(file, kind));
    } catch {
      setError("This image couldn't be read. Try a different file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const round = kind === "photo";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className="text-[13px] font-medium text-soft">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-line bg-tint",
            round ? "rounded-full" : "rounded-key",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URLs
            <img src={value} alt={`${label} preview`} className={cn("h-full w-full", round ? "object-cover" : "object-contain p-1.5")} />
          ) : (
            <ImageIcon size={24} aria-hidden="true" className="text-faint" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="tint"
            size="sm"
            icon={UploadSimple}
            loading={busy}
            disabled={disabled}
            aria-describedby={`${id}-label`}
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Replace" : "Upload"}
          </Button>
          {value ? (
            <Button variant="ghost" size="sm" disabled={disabled || busy} aria-describedby={`${id}-label`} onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error ? (
        <div role="alert">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}
      {helper ? <p className="text-[13px] text-soft">{helper}</p> : null}
    </div>
  );
}
