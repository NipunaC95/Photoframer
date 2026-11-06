import { SourceImageItem, ImageOrientation } from '../types';

export const isElectronApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff'];

export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  const name = file.name.toLowerCase();
  return VALID_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function parseFileToSourceItem(file: File): Promise<SourceImageItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / (height || 1);
      const orientation: ImageOrientation =
        Math.abs(aspectRatio - 1.0) < 0.05
          ? 'square'
          : aspectRatio > 1.0
          ? 'landscape'
          : 'portrait';

      resolve({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        filePath: file.name,
        fileSize: file.size,
        width,
        height,
        aspectRatio,
        orientation,
        thumbnailUrl: url,
        rawFile: file,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image: ${file.name}`));
    };
    img.src = url;
  });
}

export async function parseFilesToSourceItems(
  files: FileList | File[]
): Promise<SourceImageItem[]> {
  const fileArray = Array.from(files).filter(isImageFile);
  const items: SourceImageItem[] = [];

  for (const file of fileArray) {
    try {
      const item = await parseFileToSourceItem(file);
      items.push(item);
    } catch (err) {
      console.warn('Skipping file due to load error:', file.name, err);
    }
  }

  return items;
}

export function selectFilesWeb(multiple = true): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
    input.style.display = 'none';

    input.onchange = () => {
      const files = input.files ? Array.from(input.files).filter(isImageFile) : [];
      document.body.removeChild(input);
      resolve(files);
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve([]);
    };

    document.body.appendChild(input);
    input.click();
  });
}

export function selectFolderWeb(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    (input as any).webkitdirectory = true;
    input.style.display = 'none';

    input.onchange = () => {
      const files = input.files ? Array.from(input.files).filter(isImageFile) : [];
      document.body.removeChild(input);
      resolve(files);
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve([]);
    };

    document.body.appendChild(input);
    input.click();
  });
}

export function selectWatermarkWeb(): Promise<{
  filePath: string;
  thumbnailUrl: string;
  fileName: string;
  rawFile: File;
} | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.accept = 'image/png,image/webp,image/svg+xml,image/jpeg';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (file && isImageFile(file)) {
        const url = URL.createObjectURL(file);
        resolve({
          filePath: file.name,
          thumbnailUrl: url,
          fileName: file.name,
          rawFile: file,
        });
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

