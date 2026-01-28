'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Upload,
  File,
  Image,
  FileText,
  Film,
  Music,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

interface FileWithPreview extends File {
  preview?: string;
}

interface UploadedFile {
  id: string;
  file: FileWithPreview;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload: (files: File[]) => Promise<void>;
  className?: string;
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  onUpload,
  className,
}: FileUploadProps) {
  const { theme } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Film;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File too large. Max size is ${formatFileSize(maxSize)}`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type;
      });
      if (!isAccepted) {
        return 'File type not allowed';
      }
    }
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const remainingSlots = maxFiles - files.length;

    if (remainingSlots <= 0) return;

    const filesToAdd = fileArray.slice(0, remainingSlots).map(file => {
      const error = validateFile(file);
      const fileWithPreview = file as FileWithPreview;

      // Create preview for images
      if (file.type.startsWith('image/') && !error) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        file: fileWithPreview,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
      } as UploadedFile;
    });

    setFiles(prev => [...prev, ...filesToAdd]);
  }, [files.length, maxFiles, maxSize, accept]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.file.preview) {
        URL.revokeObjectURL(file.file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status === 'pending');
    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Update status to uploading
    setFiles(prev => prev.map(f =>
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    ));

    try {
      await onUpload(validFiles.map(f => f.file));

      // Update status to complete
      setFiles(prev => prev.map(f =>
        f.status === 'uploading' ? { ...f, status: 'complete' as const, progress: 100 } : f
      ));
    } catch {
      // Update status to error
      setFiles(prev => prev.map(f =>
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-omnifocus-purple bg-omnifocus-purple/10'
            : theme === 'dark'
              ? 'border-omnifocus-border hover:border-gray-600 hover:bg-omnifocus-surface/50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload
          size={40}
          className={clsx(
            'mx-auto mb-3',
            isDragging ? 'text-omnifocus-purple' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}
        />

        <p className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className={clsx(
          'text-xs mt-1',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          or click to browse
        </p>

        {(accept || maxSize) && (
          <p className={clsx(
            'text-xs mt-3',
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          )}>
            {accept && `Accepted: ${accept}`}
            {accept && maxSize && ' • '}
            {maxSize && `Max size: ${formatFileSize(maxSize)}`}
          </p>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => {
            const Icon = getFileIcon(file.file.type);

            return (
              <div
                key={file.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg',
                  theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
                )}
              >
                {/* Preview or icon */}
                {file.file.preview ? (
                  <img
                    src={file.file.preview}
                    alt={file.file.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className={clsx(
                    'w-10 h-10 rounded flex items-center justify-center',
                    theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-200'
                  )}>
                    <Icon size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    'text-sm font-medium truncate',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {file.file.name}
                  </p>
                  <p className={clsx(
                    'text-xs',
                    file.status === 'error'
                      ? 'text-red-500'
                      : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {file.status === 'error' ? file.error : formatFileSize(file.file.size)}
                  </p>
                </div>

                {/* Status indicator */}
                {file.status === 'uploading' && (
                  <Loader2 size={16} className="animate-spin text-omnifocus-purple" />
                )}
                {file.status === 'complete' && (
                  <Check size={16} className="text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle size={16} className="text-red-500" />
                )}

                {/* Remove button */}
                {(file.status === 'pending' || file.status === 'error') && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className={clsx(
                      'p-1 rounded transition-colors',
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-omnifocus-bg'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                    )}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={clsx(
            'w-full py-2 text-sm font-medium rounded-lg transition-colors',
            'bg-omnifocus-purple text-white hover:bg-purple-600',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </span>
          ) : (
            `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`
          )}
        </button>
      )}
    </div>
  );
}

// Simple file input
interface SimpleFileInputProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  placeholder?: string;
  className?: string;
}

export function SimpleFileInput({
  value,
  onChange,
  accept,
  placeholder = 'Choose file...',
  className,
}: SimpleFileInputProps) {
  const { theme } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] || null);
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'px-3 py-2 text-sm rounded-lg border transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-white hover:bg-omnifocus-bg'
            : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
        )}
      >
        Browse
      </button>
      <span className={clsx(
        'text-sm flex-1 truncate',
        value
          ? theme === 'dark' ? 'text-white' : 'text-gray-900'
          : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        {value?.name || placeholder}
      </span>
      {value && (
        <button
          onClick={() => onChange(null)}
          className={clsx(
            'p-1 rounded',
            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
