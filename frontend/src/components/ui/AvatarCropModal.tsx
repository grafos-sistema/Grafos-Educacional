'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function fileToBlobUrl(file: File) {
  return URL.createObjectURL(file);
}

function getOutputType(inputType: string) {
  if (inputType === 'image/png') return 'image/png';
  return 'image/jpeg';
}

function replaceFileExtension(fileName: string, extension: 'png' | 'jpg') {
  const base = fileName.replace(/\.[^/.]+$/, '');
  return `${base || 'avatar'}.${extension}`;
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
  title = 'Ajustar imagem',
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

  const setClampedZoom = (value: number) => {
    setUserZoom(clamp(value, 1, 3));
  };

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
      dragStartRef.current = null;
      touchStateRef.current = null;
      setIsDragging(false);
      return;
    }

    let isActive = true;
    let nextUrl: string | null = null;

    void (async () => {
      nextUrl = await fileToBlobUrl(file);
      if (!isActive) return;
      setBlobUrl(nextUrl);
    })();

    return () => {
      isActive = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
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
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setOffset({ x: 0, y: 0 });
    setUserZoom(1);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const [first, second] = [touches[0], touches[1]];
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
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
      const distance = getTouchDistance(event.touches);
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
      const distance = getTouchDistance(event.touches);
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

      setClampedZoom(touchState.zoom * (distance / touchState.distance));
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
      const distance = getTouchDistance(event.touches);
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

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    setUserZoom((current) => clamp(current + delta, 1, 3));
  };

  const exportCroppedFile = async () => {
    const img = imgRef.current;
    const currentFile = file;
    if (!img || !naturalSize || !containerSize || !currentFile) return;

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

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

      const blob = await new Promise<Blob | null>((resolve) => {
        const quality = outputType === 'image/jpeg' ? 0.92 : undefined;
        canvas.toBlob(
          (value) => resolve(value),
          outputType,
          quality
        );
      });

      if (!blob) return;
      const nextName = replaceFileExtension(currentFile.name, extension);
      const nextFile = new File([blob], nextName, { type: outputType, lastModified: Date.now() });
      onConfirm(nextFile);
    } finally {
      setIsExporting(false);
    }
  };

  const canRenderEditor = Boolean(blobUrl);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="3xl"
      title={title}
      description="Arraste para enquadrar e ajuste o zoom para ficar na proporção certa."
      panelClassName="p-6"
      contentClassName="mt-0"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="w-full sm:w-auto">
            <div
              ref={containerRef}
              className={`relative mx-auto h-[320px] w-[320px] overflow-hidden rounded-2xl bg-gray-900/90 shadow-inner select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'none' }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
              onWheel={onWheel}
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
                    onLoad={handleImageLoad}
                    draggable={false}
                    style={{
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: 'center',
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-200">
                  Carregando imagem...
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
              <div className="pointer-events-none absolute inset-0 border-[10px] border-white/12 rounded-2xl" />
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 sm:flex-1">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Prévia</span>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-900">
                  {canRenderEditor ? (
                    <div
                      className="absolute left-1/2 top-1/2"
                      style={{
                        transform: `translate(-50%, -50%) translate(${offset.x * (80 / (containerSize?.w ?? 320))}px, ${
                          offset.y * (80 / (containerSize?.h ?? 320))
                        }px)`,
                      }}
                    >
                      <img
                        src={blobUrl as string}
                        alt="Prévia"
                        className="max-w-none pointer-events-none"
                        draggable={false}
                        style={{
                          transform: `scale(${effectiveScale * (80 / (containerSize?.w ?? 320))})`,
                          transformOrigin: 'center',
                        }}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <div>Proporção: 1:1</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Saída: {outputSize}×{outputSize}</div>
                </div>
              </div>
            </div>

            <div className="mt-1 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={isExporting}>
                Cancelar
              </Button>
              <Button type="button" onClick={exportCroppedFile} isLoading={isExporting} disabled={!canRenderEditor}>
                Usar esta imagem
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
