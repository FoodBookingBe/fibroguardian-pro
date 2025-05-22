import React from 'react';

'use client';
import { useState, useEffect, useRef, ImgHTMLAttributes, CSSProperties } from 'react'; // Added CSSProperties
import Image, { ImageProps } from 'next/image'; // Import ImageProps

// Combine NextImageProps with standard Img attributes, but Omit src, alt, width, height as they are explicitly defined
interface LazyImageProps extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'style' | 'placeholder'> {
  src: string; // src is required
  alt: string; // alt is required
  width?: number | `${number}` | undefined; // Use Next.js Image's width type
  height?: number | `${number}` | undefined; // Use Next.js Image's height type
  blurEffect?: boolean; // Renamed from blur to avoid conflict with NextImage's blurDataURL
  priority?: boolean;
  placeholder?: "blur" | "empty" | undefined; // Use Next.js Image's placeholder type
  objectFit?: CSSProperties['objectFit']; // Use CSSProperties for objectFit
  className?: string; // Allow passing a className for the wrapper
  imageClassName?: string; // Allow passing a className for the Next/Image component itself
  wrapperStyle?: CSSProperties; // Allow custom styles for the wrapper
}

/**
 * Geoptimaliseerde afbeeldingscomponent met lazy loading en optioneel blur-up effect.
 * Gebruikt Next/Image voor optimalisaties.
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  blurEffect = true, // Default to true for the blur-up effect
  priority = false,
  placeholder = 'empty', // Default Next/Image placeholder
  objectFit = 'cover',
  className = '',
  imageClassName = '',
  wrapperStyle = {},
  ...rest // Spread remaining Next/Image props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      setIsLoaded(true); // Assume priority images are loaded quickly or are critical
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target); // Disconnect after first intersection
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.01 } // Load 200px before they enter viewport
    );

    const currentRef = imageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority]);

  // For blur-up effect, Next/Image's `placeholder="blur"` and `blurDataURL` are preferred.
  // This custom blur is a fallback or alternative.
  const imageStyle: CSSProperties = {
    transition: 'filter 0.4s ease-in-out, opacity 0.4s ease-in-out',
    width: '100%', // Ensure image fills container
    height: '100%',
    objectFit: objectFit,
  };

  if (blurEffect && !isLoaded && isInView) {
    imageStyle.filter = 'blur(8px)'; // Adjust blur amount as needed
    imageStyle.opacity = 0.8;
  } else if (isLoaded) {
    imageStyle.filter = 'none';
    imageStyle.opacity = 1;
  }


  // Determine dimensions for Next/Image. If not provided, use fill.
  const layoutProps = width && height ? { width, height } : { fill: true };

  return (
    <div 
      ref={imageRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width: width ? `${width}px` : (layoutProps.fill ? '100%' : 'auto'), 
        height: height ? `${height}px` : (layoutProps.fill ? '100%' : 'auto'),
        minHeight: '1px', // Prevent collapse before loading
        ...wrapperStyle 
      }}
    >
      {(isInView || priority) ? (
        <Image
          src={src}
          alt={alt}
          {...layoutProps} // Use fill or width/height
          onLoad={() => setIsLoaded(true)}
          style={imageStyle} // Apply custom blur or other styles
          className={imageClassName}
          priority={priority}
          // If using Next/Image's blur, provide blurDataURL
          placeholder={blurEffect && src.startsWith('data:') ? undefined : placeholder} // Don't use Next/Image blur if custom is active and not a data URL
          {...rest}
        />
      ) : (
        <div 
          className="bg-gray-200 animate-pulse" 
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '100%',
            minHeight: height ? `${height}px` : '100px' // Placeholder min height
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}