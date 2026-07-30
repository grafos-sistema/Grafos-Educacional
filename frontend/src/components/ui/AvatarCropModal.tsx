'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getOutputType(inputType: string) {
  if (inputType === 'image/png') return 'image/png';
  return 'image/jpeg';
}

function replaceFileExtension(fileName: string, extension: 'png' | 'jpg') {
  const base = fileName.replace(/\.[^/.]+$/, '');
  return `${base || 'avatar'}.${extension}`;
}

function getDistance(touches: React.TouchList) {
  if (touches.length < 2) return null;
  const [first, second] = [touches[0], touches[1]];
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

export interface AvatarCropModalProps {
  isOpen: boolean;
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  outputSize?: number;
  title?: string;
}

export function AvatarCropModal({
  isOpen,
  file,
  onCancel,
  onConfirm,
  outputSize = 512,
  title = 'Escolher foto do perfil',
}: AvatarCropModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ point: Point; offset: Point } | null>(null);
  const touchStateRef = useRef<
    | { mode: 'drag'; point: Point; offset: Point }
    | { mode: 'pinch'; distance: number; zoom: number }
    | null
  >(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const [userZoom, setUserZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const baseScale = useMemo(() => {
    if (!naturalSize || !containerSize) return 1;
    return Math.max(containerSize.w / naturalSize.w, containerSize.h / naturalSize.h);
  }, [containerSize, naturalSize]);

  const effectiveScale = useMemo(() => baseScale * userZoom, [baseScale, userZoom]);

  const offsetLimits = useMemo(() => {
    if (!naturalSize || !containerSize) return { maxX: 0, maxY: 0 };
    const displayW = naturalSize.w * effectiveScale;
    const displayH = naturalSize.h * effectiveScale;

    return {
      maxX: Math.max(0, (displayW - containerSize.w) / 2),
      maxY: Math.max(0, (displayH - containerSize.h) / 2),
    };
  }, [containerSize, effectiveScale, naturalSize]);

  useEffect(() => {
    if (!isOpen || !file) {
      setBlobUrl(null);
      setNaturalSize(null);
      setContainerSize(null);
      setUserZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
      dragStartRef.current = null;
      touchStateRef.current = null;
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setBlobUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen]);

  useEffect(() => {
    setOffset((current) => ({
      x: clamp(current.x, -offsetLimits.maxX, offsetLimits.maxX),
      y: clamp(current.y, -offsetLimits.maxY, offsetLimits.maxY),
    }));
  }, [offsetLimits.maxX, offsetLimits.maxY]);

  const handleImageLoad = () => {
    const image = imgRef.current;
    if (!image) return;
    setNaturalSize({ w: image.naturalWidth, h: image.naturalHeight });
    setUserZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const onMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragStartRef.current = {
      point: { x: event.clientX, y: event.clientY },
      offset,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !dragStartRef.current) return;

    const handleMouseMove = (event: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = event.clientX - start.point.x;
      const dy = event.clientY - start.point.y;
      setOffset({
        x: clamp(start.offset.x + dx, -offsetLimits.maxX, offsetLimits.maxX),
        y: clamp(start.offset.y + dy, -offsetLimits.maxY, offsetLimits.maxY),
      });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offsetLimits.maxX, offsetLimits.maxY]);

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length >= 2) {
      const distance = getDistance(event.touches);
      if (!distance) return;
      touchStateRef.current = {
        mode: 'pinch',
        distance,
        zoom: userZoom,
      };
      setIsDragging(false);
      return;
    }

    const touch = event.touches[0];
    if (!touch) return;
    touchStateRef.current = {
      mode: 'drag',
      point: { x: touch.clientX, y: touch.clientY },
      offset,
    };
    setIsDragging(true);
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!touchStateRef.current) return;
    event.preventDefault();

    if (event.touches.length >= 2) {
      const distance = getDistance(event.touches);
      const touchState = touchStateRef.current;
      if (!distance) return;

      if (touchState.mode !== 'pinch') {
        touchStateRef.current = {
          mode: 'pinch',
          distance,
          zoom: userZoom,
        };
        setIsDragging(false);
        return;
      }

      setUserZoom(clamp(touchState.zoom * (distance / touchState.distance), 1, 3));
      return;
    }

    const touch = event.touches[0];
    const touchState = touchStateRef.current;
    if (!touch || touchState.mode !== 'drag') return;

    const dx = touch.clientX - touchState.point.x;
    const dy = touch.clientY - touchState.point.y;
    setOffset({
      x: clamp(touchState.offset.x + dx, -offsetLimits.maxX, offsetLimits.maxX),
      y: clamp(touchState.offset.y + dy, -offsetLimits.maxY, offsetLimits.maxY),
    });
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length >= 2) {
      const distance = getDistance(event.touches);
      if (!distance) return;
      touchStateRef.current = {
        mode: 'pinch',
        distance,
        zoom: userZoom,
      };
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStateRef.current = {
        mode: 'drag',
        point: { x: touch.clientX, y: touch.clientY },
        offset,
      };
      setIsDragging(true);
      return;
    }

    touchStateRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const nextZoomDelta = event.deltaY < 0 ? 0.08 : -0.08;
      setUserZoom((current) => clamp(current + nextZoomDelta, 1, 3));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  const exportCroppedFile = async () => {
    const image = imgRef.current;
    const currentFile = file;
    if (!image || !naturalSize || !containerSize || !currentFile) return;

    setIsExporting(true);
    try {
      const outputType = getOutputType(currentFile.type);
      const extension = outputType === 'image/png' ? 'png' : 'jpg';
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const displayW = naturalSize.w * effectiveScale;
      const displayH = naturalSize.h * effectiveScale;
      const imgLeft = containerSize.w / 2 - displayW / 2 + offset.x;
      const imgTop = containerSize.h / 2 - displayH / 2 + offset.y;

      const srcX = clamp((0 - imgLeft) / effectiveScale, 0, naturalSize.w);
      const srcY = clamp((0 - imgTop) / effectiveScale, 0, naturalSize.h);
      const srcW = clamp(containerSize.w / effectiveScale, 0, naturalSize.w - srcX);
      const srcH = clamp(containerSize.h / effectiveScale, 0, naturalSize.h - srcY);

      ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

      const blob = await new Promise<Blob | null>((resolve) => {
        ctx.canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? 0.92 : undefined);
      });

      if (!blob) return;
      const nextName = replaceFileExtension(currentFile.name, extension);
      onConfirm(new File([blob], nextName, { type: outputType, lastModified: Date.now() }));
    } finally {
      setIsExporting(false);
    }
  };

  const canRenderEditor = Boolean(blobUrl);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 backdrop-blur-md">
      <div
        className="absolute inset-0"
        onClick={onCancel}
      />

      <div className="relative z-[81] w-full max-w-[780px] overflow-hidden rounded-[22px] border border-[#d9e4f2] bg-[#f8fbff] text-[#0f172a] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="relative border-b border-[#dbe6f3] px-8 py-6 text-center">
          <h2 className="text-[30px] font-semibold tracking-[-0.02em]">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf3fb] text-[#64748b] transition hover:bg-[#dfe9f7] hover:text-[#334155]"
            aria-label="Fechar ajuste de imagem"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
        </div>

        <div className="px-8 py-7">
          <div className="flex flex-col items-center gap-8">
            <div
              ref={containerRef}
              className={`relative h-[420px] w-[420px] max-w-full overflow-hidden rounded-[18px] border border-[#d8e4f3] bg-[#eef5ff] shadow-inner select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'none' }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
            >
              {canRenderEditor ? (
                <div
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                  }}
                >
                  <img
                    ref={imgRef}
                    src={blobUrl as string}
                    alt="Imagem selecionada"
                    className="max-w-none pointer-events-none"
                    draggable={false}
                    onLoad={handleImageLoad}
                    style={{
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: 'center',
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white/70">
                  Carregando imagem...
                </div>
              )}

              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at center, transparent 0 42.5%, rgba(59,130,246,0.14) 43%, rgba(15,23,42,0.22) 100%)',
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[320px] w-[320px] rounded-full border border-white/75 shadow-[0_0_0_1px_rgba(148,163,184,0.18)]" />
              </div>
            </div>

            <div className="flex w-full max-w-[420px] items-center gap-4">
              <button
                type="button"
                onClick={() => setUserZoom((current) => clamp(current - 0.08, 1, 3))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#e6eef9] hover:text-[#0f172a]"
                aria-label="Diminuir zoom"
              >
                <MinusIcon className="h-5 w-5" />
              </button>

              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={userZoom}
                onChange={(event) => setUserZoom(Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#cfdced] accent-[#2f7cf6]"
              />

              <button
                type="button"
                onClick={() => setUserZoom((current) => clamp(current + 0.08, 1, 3))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#e6eef9] hover:text-[#0f172a]"
                aria-label="Aumentar zoom"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-[#dbe6f3] px-8 py-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2f7cf6] transition hover:bg-[#eef5ff]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={exportCroppedFile}
            disabled={!canRenderEditor || isExporting}
            className="min-w-[108px] rounded-xl bg-[#1f6fff] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isExporting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
