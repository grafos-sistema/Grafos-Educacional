/**
 * Optimized Image Component
 *
 * Wrapper sobre Next.js Image com otimizações adicionais:
 * - Lazy loading nativo
 * - Placeholder blur
 * - Responsive sizes
 * - WebP/AVIF quando suportado
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder'> {
  fallbackSrc?: string;
  showPlaceholder?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  showPlaceholder = true,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        loading="lazy"
        quality={85}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        {...props}
      />
      {showPlaceholder && isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      )}
    </div>
  );
}

/**
 * Example usage:
 *
 * <OptimizedImage
 *   src="/images/profile.jpg"
 *   alt="Foto de perfil"
 *   width={200}
 *   height={200}
 *   className="rounded-full"
 * />
 */
