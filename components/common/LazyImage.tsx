import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps extends Omit<ImageProps, 'src' | 'onLoad'> {
  src: string;
  lowQualitySrc?: string;
  fallbackSrc?: string;
  threshold?: number;
  loadingComponent?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component that implements progressive loading and lazy loading
 *
 * Features:
 * - Lazy loading using Intersection Observer
 * - Progressive loading with low quality image placeholder
 * - Fallback image for error handling
 * - Customizable loading component
 * - Accessibility support
 *
 * @param props Component properties
 * @returns LazyImage component
 */
export default function LazyImage({
  src,
  lowQualitySrc,
  fallbackSrc = '/icons/fallback-image.svg',
  alt,
  width,
  height,
  threshold = 0.1,
  loadingComponent,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(lowQualitySrc || src);
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  // Handle image loading when in view
  useEffect(() => {
    if (!inView || isLoaded) return;

    // If we don't have a low quality src or already using the main src, no need to preload
    if (!lowQualitySrc || imgSrc === src) return;

    const img = new window.Image();
    img.src = src;

    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setImgSrc(fallbackSrc);
      setHasError(true);
      if (onError) onError();
    };
  }, [inView, isLoaded, imgSrc, lowQualitySrc, src, fallbackSrc, onLoad, onError]);

  // Handle direct loading without low quality image
  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error
  const handleImageError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
      if (onError) onError();
    }
  };

  // Use the CSS class defined in globals.css
  const dimensionClasses = `${props.className || ''}`;
  
  // Create a ref to store the div element
  const divRef = useRef<HTMLDivElement>(null);
  
  // Set CSS variables using CSS custom properties
  useEffect(() => {
    if (divRef.current) {
      divRef.current.style.setProperty('--img-width', typeof width === 'number' ? `${width}px` : width as string);
      divRef.current.style.setProperty('--img-height', typeof height === 'number' ? `${height}px` : height as string);
    }
  }, [width, height]);

  return (
    <div
      ref={(node) => {
        // This handles both the IntersectionObserver ref and our local ref
        if (typeof ref === 'function') ref(node);
        // Safe way to set the ref without modifying read-only property
        if (node && divRef.current !== node) {
          // Using a non-direct assignment approach
          Object.defineProperty(divRef, 'current', {
            value: node,
            writable: true
          });
        }
      }}
      className={`lazy-image-container relative ${dimensionClasses}`}
    >
      {!isLoaded && loadingComponent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {loadingComponent}
        </div>
      )}

      {inView && (
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      )}

      {!inView && (
        <div
          className="w-full h-full bg-gray-200 animate-pulse"
          aria-label={`Loading image: ${alt}`}
        />
      )}
    </div>
  );
}
