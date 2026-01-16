// src/utils/ImageMerger.ts
import ImageEditor from 'react-native-image-editor';

interface Overlay {
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const addFilePrefix = (path: string): string => {
  return path.startsWith('file://') ? path : `file://${path}`;
};

export const mergePhotoWithOverlay = async (
  photoPath: string,
  overlay: Overlay,
  previewSize: { width: number; height: number }
): Promise<string> => {
  try {
    const photoUri = addFilePrefix(photoPath);
    console.log('Photo URI:', photoUri);

    const OUTPUT_WIDTH = 1080;
    const OUTPUT_HEIGHT = 1920;

    const scaleX = OUTPUT_WIDTH / previewSize.width;
    const scaleY = OUTPUT_HEIGHT / previewSize.height;

    const scaled = {
      x: Math.round(overlay.x * scaleX),
      y: Math.round(overlay.y * scaleY),
      width: Math.round(overlay.width * scaleX),
      height: Math.round(overlay.height * scaleY),
    };

    // Clamp
    scaled.x = Math.max(0, Math.min(scaled.x, OUTPUT_WIDTH - scaled.width));
    scaled.y = Math.max(0, Math.min(scaled.y, OUTPUT_HEIGHT - scaled.height));

    console.log('Final overlay:', scaled);

    // overlayImage WORKS in v2.3.0
    const final = await ImageEditor.overlayImage(
      photoUri,
      overlay.uri,
      scaled.x,
      scaled.y,
      scaled.width,
      scaled.height
    );

    console.log('Merged:', final);
    return final;
  } catch (error) {
    console.error('Merge failed:', error);
    throw error;
  }
};