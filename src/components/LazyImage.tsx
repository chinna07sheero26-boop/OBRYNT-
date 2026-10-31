import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetHelper';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  fallbackText?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatioClass = 'aspect-[4/5]',
  fallbackText,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${aspectRatioClass} w-full`}>
      {/* Skeleton Shimmer while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-stone-300/60" />
        </div>
      )}

      {/* Actual Lazy Loaded Image */}
      {!hasError ? (
        <img
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      ) : (
        /* Zero-broken-image fallback container */
        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-200/80 p-4 text-center text-stone-500">
          <ImageIcon className="w-6 h-6 mb-1 text-stone-400" />
          <span className="text-[11px] font-medium line-clamp-2">
            {fallbackText || alt}
          </span>
        </div>
      )}
    </div>
  );
};
