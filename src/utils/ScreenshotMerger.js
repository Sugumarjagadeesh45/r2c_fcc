// src/utils/ScreenshotMerger.ts
import { captureRef } from 'react-native-view-shot';

export const captureScreenWithOverlay = async (
  viewRef: React.RefObject<any>
): Promise<string | null> => {
  if (!viewRef.current) {
    console.warn('View ref is missing');
    return null;
  }

  try {
    const uri = await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.95,
      result: 'tmpfile',
    });
    console.log('Screenshot captured:', uri);
    return uri;
  } catch (error) {
    console.error('Screenshot failed:', error);
    return null;
  }
};



// // src/utils/ScreenshotMerger.ts
// import { captureRef } from 'react-native-view-shot';

// export const captureScreenWithOverlay = async (
//   viewRef: React.RefObject<any>
// ): Promise<string | null> => {
//   if (!viewRef.current) {
//     console.warn('View ref missing');
//     return null;
//   }

//   try {
//     const uri = await captureRef(viewRef, {
//       format: 'jpg',
//       quality: 0.95,
//       result: 'tmpfile',
//     });
//     console.log('Screenshot captured:', uri);
//     return uri;
//   } catch (error) {
//     console.error('Screenshot failed:', error);
//     return null;
//   }
// };