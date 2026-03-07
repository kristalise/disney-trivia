'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { useAuth } from '@/components/AuthProvider';

interface ImageCropUploadProps {
  bucket: string;
  path: string;
  onUpload: (url: string) => void;
  aspect?: number;
  maxSizeMB?: number;
  children?: React.ReactNode;
  className?: string;
}

async function getCroppedBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  // Try WebP first, fall back to JPEG
  const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      supportsWebP ? 'image/webp' : 'image/jpeg',
      0.92,
    );
  });
}

export default function ImageCropUpload({
  bucket,
  path,
  onUpload,
  aspect = 1,
  maxSizeMB = 0.9,
  children,
  className,
}: ImageCropUploadProps) {
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB');
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCancel = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setError(null);
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Crop
      const croppedBlob = await getCroppedBlob(imageSrc, croppedAreaPixels);

      // 2. Compress
      const compressedFile = await imageCompression(
        new File([croppedBlob], 'photo.webp', { type: croppedBlob.type }),
        {
          maxSizeMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: croppedBlob.type === 'image/webp' ? 'image/webp' : 'image/jpeg',
        },
      );

      // 3. Upload via server API
      const ext = compressedFile.type === 'image/webp' ? 'webp' : 'jpg';
      const fullPath = `${path}.${ext}`;

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('bucket', bucket);
      formData.append('path', fullPath);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const { url: publicUrl } = await res.json();

      // 4. Callback
      onUpload(publicUrl);
      handleCancel();
    } catch (err) {
      console.error('Crop/upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <div className={className} onClick={() => inputRef.current?.click()}>
        {children}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex flex-col">
          {/* Cropper area */}
          <div className="relative flex-1 min-h-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="bg-slate-900 p-4 space-y-3">
            {/* Zoom slider */}
            <div className="flex items-center gap-3 px-2">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-disney-gold"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm bg-slate-700 text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm btn-disney disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Crop & Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
