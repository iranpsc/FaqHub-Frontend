'use client';

import React from 'react';
import Image from 'next/image';

interface OptimizedHeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const OptimizedHeroImage: React.FC<OptimizedHeroImageProps> = ({
  src,
  alt,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-lg shadow-sm ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={480}
        className="w-full h-auto object-cover"
       
        priority
        sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px"
        quality={85}
        
        style={{
          aspectRatio: '1200/480',
          objectFit: 'cover',
        }}
      
      />
    </div>
  );
};
