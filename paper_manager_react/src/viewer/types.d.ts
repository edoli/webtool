

export interface ImageData {
  width: number;
  height: number;
  pixels: any; // GPU.js texture type
}
  
export interface ControlValues {
  brightness: number;
  exposure: number;
  gamma: number;
}
