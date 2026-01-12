export {};

declare global {
  interface Window {
    FFmpeg?: {
      createFFmpeg: (options: { log: boolean }) => any;
      fetchFile: (file: File) => Promise<Uint8Array>;
    };
  }
}
