'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { User } from 'lucide-react';
import clsx from 'clsx';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string; icon: number; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 12, status: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 14, status: 'w-2 h-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 18, status: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', text: 'text-base', icon: 22, status: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', text: 'text-lg', icon: 28, status: 'w-3.5 h-3.5' },
};

const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

// Generate a consistent color from a string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#8B5CF6', // purple
    '#3B82F6', // blue
    '#10B981', // green
    '#F97316', // orange
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#F59E0B', // amber
  ];
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const { theme } = useAppStore();
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_CLASSES[size];

  const showImage = src && !imageError;
  const showInitials = !showImage && name;
  const backgroundColor = name ? stringToColor(name) : undefined;

  return (
    <div className={clsx('relative inline-flex', className)}>
      <div
        className={clsx(
          'rounded-full overflow-hidden flex items-center justify-center font-medium',
          sizeConfig.container,
          !showImage && !showInitials && (
            theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
          )
        )}
        style={showInitials ? { backgroundColor } : undefined}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : showInitials ? (
          <span className={clsx('text-white', sizeConfig.text)}>
            {getInitials(name)}
          </span>
        ) : (
          <User
            size={sizeConfig.icon}
            className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
          />
        )}
      </div>

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2',
            sizeConfig.status,
            STATUS_COLORS[status],
            theme === 'dark' ? 'border-omnifocus-sidebar' : 'border-white'
          )}
        />
      )}
    </div>
  );
}

// Avatar group (stacked avatars)
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
  className,
}: AvatarGroupProps) {
  const { theme } = useAppStore();
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, i) => (
        <div
          key={i}
          className={clsx(
            'ring-2',
            theme === 'dark' ? 'ring-omnifocus-sidebar' : 'ring-white'
          )}
          style={{ zIndex: visibleAvatars.length - i }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-medium ring-2',
            sizeConfig.container,
            sizeConfig.text,
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 ring-omnifocus-sidebar'
              : 'bg-gray-200 text-gray-600 ring-white'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar with name
interface AvatarWithNameProps {
  src?: string | null;
  name: string;
  subtitle?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export function AvatarWithName({
  src,
  name,
  subtitle,
  size = 'md',
  status,
  className,
}: AvatarWithNameProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <Avatar src={src} name={name} size={size} status={status} />
      <div className="min-w-0">
        <p className={clsx(
          'font-medium truncate',
          size === 'xs' || size === 'sm' ? 'text-sm' : 'text-base',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {name}
        </p>
        {subtitle && (
          <p className={clsx(
            'truncate',
            size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Clickable avatar button
interface AvatarButtonProps extends AvatarProps {
  onClick?: () => void;
}

export function AvatarButton({ onClick, ...props }: AvatarButtonProps) {
  const { theme } = useAppStore();

  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
        theme === 'dark'
          ? 'focus:ring-omnifocus-purple focus:ring-offset-omnifocus-sidebar'
          : 'focus:ring-omnifocus-purple focus:ring-offset-white'
      )}
    >
      <Avatar {...props} />
    </button>
  );
}

// Editable avatar with upload
interface EditableAvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  onUpload?: (file: File) => void;
  className?: string;
}

export function EditableAvatar({
  src,
  name,
  size = 'lg',
  onUpload,
  className,
}: EditableAvatarProps) {
  const { theme } = useAppStore();
  const sizeConfig = SIZE_CLASSES[size];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <label className={clsx('relative inline-flex cursor-pointer group', className)}>
      <Avatar src={src} name={name} size={size} />
      <div className={clsx(
        'absolute inset-0 rounded-full flex items-center justify-center',
        'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity'
      )}>
        <span className="text-white text-xs font-medium">Edit</span>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />
    </label>
  );
}
