"use client";
/* eslint-disable @next/next/no-img-element -- local blob and cropped data URL previews */

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";

const SIZE = 256;

export function SquareImageCropper({ label, value, onChange }: {
  label: string; value: string | null; onChange(value: string): void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ width: 1, height: 1 });
  const base = Math.max(SIZE / natural.width, SIZE / natural.height);
  const scale = base * zoom;
  const width = natural.width * scale;
  const height = natural.height * scale;
  const clamp = (x: number, y: number, nextZoom = zoom) => {
    const factor = base * nextZoom;
    return { x: Math.max((SIZE - natural.width * factor) / 2, Math.min((natural.width * factor - SIZE) / 2, x)),
      y: Math.max((SIZE - natural.height * factor) / 2, Math.min((natural.height * factor - SIZE) / 2, y)) };
  };

  useEffect(() => () => { if (source.startsWith("blob:")) URL.revokeObjectURL(source); }, [source]);
  const choose = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setError("请选择 PNG、JPEG 或 WebP 图片。"); return; }
    if (file.size > 8 * 1024 * 1024) { setError("原图不能超过 8 MB。"); return; }
    setError(""); setNatural({ width: 1, height: 1 }); setOffset({ x: 0, y: 0 }); setZoom(1);
    setSource(URL.createObjectURL(file));
  };
  const cancel = () => { setSource(""); setError(""); };
  const confirm = () => {
    if (!image.current || natural.width === 1) return;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE; canvas.height = SIZE;
    const context = canvas.getContext("2d");
    if (!context) { setError("浏览器无法裁剪图片。"); return; }
    context.drawImage(image.current, (SIZE - width) / 2 + offset.x, (SIZE - height) / 2 + offset.y, width, height);
    const cropped = canvas.toDataURL("image/webp", 0.82);
    if (cropped.length > 350_000) { setError("裁剪结果超过 256 KB，请选择更简单的图片。"); return; }
    onChange(cropped); cancel();
  };
  return <div className="space-y-2">
    <p className="text-xs font-medium text-slate-700">{label}</p>
    <div className="flex items-center gap-3">
      {value ? <img src={value} alt={`${label}预览`} className="h-16 w-16 rounded-md object-cover" /> :
        <div className="grid h-16 w-16 place-items-center rounded-md bg-slate-900 text-sm font-semibold text-white">{label === "个人头像" ? "CDC" : "AI"}</div>}
      <Button type="button" variant="outline" onClick={() => input.current?.click()}>选择图片并裁剪</Button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
        choose(event.target.files?.[0]); event.target.value = "";
      }} />
    </div>
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    <Dialog open={Boolean(source)} title={`裁剪${label}`} size="lg" onClose={cancel}
      footer={<><Button type="button" variant="outline" onClick={cancel}>取消</Button><Button type="button" variant="outline" onClick={() => input.current?.click()}>重新选择</Button><Button type="button" onClick={confirm}>确认裁剪</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">拖动图片调整位置，缩放后保存正方形区域。</p>
        <div className="mx-auto relative h-64 w-64 touch-none overflow-hidden rounded-md border border-slate-300 bg-slate-100 cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={(event) => { if (drag.current) setOffset(clamp(drag.current.offsetX + event.clientX - drag.current.x, drag.current.offsetY + event.clientY - drag.current.y)); }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          {source && <img ref={image} src={source} alt="裁剪区域预览" draggable={false}
            onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            style={{ position: "absolute", width, height, left: (SIZE - width) / 2 + offset.x,
              top: (SIZE - height) / 2 + offset.y, maxWidth: "none", userSelect: "none", pointerEvents: "none" }} />}
        </div>
        <label className="block text-sm">缩放：{Math.round(zoom * 100)}%<input type="range" min="1" max="3" step="0.01" value={zoom}
          className="mt-2 w-full" onChange={(event) => { const next = Number(event.target.value); setOffset(clamp(offset.x, offset.y, next)); setZoom(next); }} /></label>
        <p className="text-center text-xs text-slate-500">预览即为保存后的头像或图标</p>
      </div>
    </Dialog>
  </div>;
}
