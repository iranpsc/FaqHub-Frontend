'use client';

import { HTMLAttributes, forwardRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import { AvatarSvg } from './AvatarSvg';
import { resolveAvatarSrc } from '@/lib/avatar';

interface BaseAvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'default' | 'secondary';
  status?: 'online' | 'offline' | 'away';
}

const getFallbackAvatarUrl = (name: string, pixelSize: number) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${pixelSize}&background=3b82f6&color=fff&bold=true`;

export const BaseAvatar = forwardRef<HTMLDivElement, BaseAvatarProps>(
  ({
    src,
    name = 'User',
    size = 'md',
    variant = 'default',
    status,
    className,
    ...props
  }, ref) => {
    const [imageError, setImageError] = useState(false);
    const validSrc = resolveAvatarSrc(src);

    useEffect(() => {
      setImageError(false);
    }, [src]);

    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    };

    const sizeMap = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
      '2xl': 80,
    };

    const variantClasses = {
      default: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white',
    };

    const statusClasses = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
    };

    const displaySrc = imageError || !validSrc
      ? getFallbackAvatarUrl(name, sizeMap[size] * 2)
      : validSrc;

    return (
      <div
        ref={ref}
        className={clsx(
          'relative inline-flex items-center justify-center rounded-full font-medium overflow-hidden shrink-0',
          sizeClasses[size],
          !validSrc || imageError ? variantClasses[variant] : 'bg-gray-200 dark:bg-gray-700',
          className
        )}
        {...props}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            alt={name ? `تصویر ${name}` : 'تصویر کاربر'}
            width={sizeMap[size]}
            height={sizeMap[size]}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <AvatarSvg size={size} className="h-full w-full" />
        )}

        {status && (
          <span
            className={clsx(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800',
              statusClasses[status],
              {
                'w-2 h-2': size === 'xs' || size === 'sm',
                'w-3 h-3': size === 'md',
                'w-4 h-4': size === 'lg' || size === 'xl',
                'w-5 h-5': size === '2xl',
              }
            )}
          />
        )}
      </div>
    );
  }
);

BaseAvatar.displayName = 'BaseAvatar';
