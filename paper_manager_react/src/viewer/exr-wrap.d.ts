
type Pixels = Float32Array;
type Planes = Map<string, Float32Array>;


interface EXRModule {
  loadEXRRaw(buffer: ArrayBuffer, size: number): EXRImage;
  loadEXRVec(bytes: ArrayBuffer): EXRImage;
  loadEXRStr(bytes: ArrayBuffer): EXRImage;
};

interface EXRImage {
  width: number;
  height: number;
  planes: Planes;
  plane(name: string): Float32Array | undefined;
  channels(): string[];
};

export declare module './exr-wrap.js' {
  export const exr: Promise<EXRModule>;
}