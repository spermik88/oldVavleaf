// Global type declarations for native modules
declare global {
  // Define the VolumeButtonListener interface
  interface VolumeButtonListener {
    addListener: (eventName: string, callback: () => void) => void;
    removeListener: (eventName: string, callback: () => void) => void;
  }

  // Define the ExifWriter interface
  interface ExifWriter {
    writeExifToJpeg: (sourceUri: string, destinationUri: string, exifData: any) => Promise<string>;
    addExifComment: (imageUri: string, comment: string) => Promise<string>;
  }

  // Define the OpenCV interface
  interface OpenCV {
    // Core functions
    imread: (imageUri: string) => Promise<any>;
    imwrite: (imageUri: string, mat: any) => Promise<string>;
    cvtColor: (src: any, dst: any, code: number) => void;
    GaussianBlur: (src: any, dst: any, size: any, sigma: number) => void;
    threshold: (src: any, dst: any, thresh: number, maxval: number, type: number) => void;
    findContours: (image: any, contours: any, hierarchy: any, mode: number, method: number) => void;
    contourArea: (contour: any) => number;
    arcLength: (curve: any, closed: boolean) => number;
    approxPolyDP: (curve: any, approx: any, epsilon: number, closed: boolean) => void;
    moments: (array: any) => any;
    getPerspectiveTransform: (src: any, dst: any) => any;
    warpPerspective: (src: any, dst: any, M: any, dsize: any) => void;
    matFromArray: (rows: number, cols: number, type: number, data: number[]) => any;
    
    // Constants
    COLOR_RGBA2GRAY: number;
    COLOR_BGR2GRAY: number;
    THRESH_BINARY: number;
    THRESH_BINARY_INV: number;
    THRESH_OTSU: number;
    RETR_EXTERNAL: number;
    RETR_LIST: number;
    CHAIN_APPROX_SIMPLE: number;
    CV_32FC2: number;
    
    // Classes
    Mat: any;
    MatVector: any;
    Size: any;
  }

  // Add these interfaces to the global namespace
  var VolumeButtonListener: VolumeButtonListener | undefined;
  var ExifWriter: ExifWriter | undefined;
  var OpenCV: OpenCV | undefined;
}

export {};