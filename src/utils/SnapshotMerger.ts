// src/utils/SnapshotMerger.ts
import { captureRef } from 'react-native-view-shot';

export const captureScreenWithOverlay = async (
  viewRef: React.RefObject<any>
): Promise<string | null> => {
  if (!viewRef.current) return null;

  try {
    const uri = await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.95,
      result: 'tmpfile',
    });
    console.log('ViewShot captured with overlay:', uri);
    return uri;
  } catch (error) {
    console.warn('ViewShot failed:', error);
    return null;
  }
};