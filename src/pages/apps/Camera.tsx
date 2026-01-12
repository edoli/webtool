import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { ToolLayout } from '../../components/ToolLayout';
import { loadScriptOnce } from '../../utils/loadScript';

type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'brightness';

type KernelThis = {
  thread: { x: number; y: number };
  color: (r: number, g: number, b: number, a: number) => void;
};
type GpuKernel = {
  setGraphical: (value: boolean) => GpuKernel;
  setDynamicOutput: (value: boolean) => GpuKernel;
  setOutput: (output: [number, number]) => GpuKernel;
  canvas: HTMLCanvasElement;
  (image: ImageData): void;
};
type GpuInstance = {
  createKernel: (fn: (this: KernelThis, image: number[][][]) => void) => GpuKernel;
};
type GpuFactory = {
  GPU: new () => GpuInstance;
};
type WindowWithGpu = Window & {
  GPU?: GpuFactory;
};
type KernelMap = Record<FilterType, GpuKernel | null>;

export function Camera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gpuRef = useRef<GpuInstance | null>(null);
  const kernelsRef = useRef<KernelMap | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState('Camera is idle.');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [filter, setFilter] = useState<FilterType>('none');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadScriptOnce('https://cdn.jsdelivr.net/npm/gpu.js@latest/dist/gpu-browser.min.js').then(() => {
      const gpuFactory = (window as WindowWithGpu).GPU;
      if (!gpuFactory) {
        setStatus('GPU.js failed to load.');
        return;
      }
      const gpu = new gpuFactory.GPU();
      gpuRef.current = gpu;
      kernelsRef.current = {
        none: null,
        grayscale: gpu
          .createKernel(function (this: KernelThis, image: number[][][]) {
            const row = (image[this.thread.y] ?? []) as number[][];
            const pixel = (row[this.thread.x] ?? [0, 0, 0]) as number[];
            const r = pixel[0] ?? 0;
            const g = pixel[1] ?? 0;
            const b = pixel[2] ?? 0;
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            this.color(gray, gray, gray, 1);
          })
          .setGraphical(true)
          .setDynamicOutput(true),
        sepia: gpu
          .createKernel(function (this: KernelThis, image: number[][][]) {
            const row = (image[this.thread.y] ?? []) as number[][];
            const pixel = (row[this.thread.x] ?? [0, 0, 0]) as number[];
            const r0 = pixel[0] ?? 0;
            const g0 = pixel[1] ?? 0;
            const b0 = pixel[2] ?? 0;
            const r = r0 * 0.393 + g0 * 0.769 + b0 * 0.189;
            const g = r0 * 0.349 + g0 * 0.686 + b0 * 0.168;
            const b = r0 * 0.272 + g0 * 0.534 + b0 * 0.131;
            this.color(Math.min(r, 1), Math.min(g, 1), Math.min(b, 1), 1);
          })
          .setGraphical(true)
          .setDynamicOutput(true),
        invert: gpu
          .createKernel(function (this: KernelThis, image: number[][][]) {
            const row = (image[this.thread.y] ?? []) as number[][];
            const pixel = (row[this.thread.x] ?? [0, 0, 0]) as number[];
            const r = pixel[0] ?? 0;
            const g = pixel[1] ?? 0;
            const b = pixel[2] ?? 0;
            this.color(1 - r, 1 - g, 1 - b, 1);
          })
          .setGraphical(true)
          .setDynamicOutput(true),
        brightness: gpu
          .createKernel(function (this: KernelThis, image: number[][][]) {
            const row = (image[this.thread.y] ?? []) as number[][];
            const pixel = (row[this.thread.x] ?? [0, 0, 0]) as number[];
            this.color(
              Math.min((pixel[0] ?? 0) * 1.5, 1),
              Math.min((pixel[1] ?? 0) * 1.5, 1),
              Math.min((pixel[2] ?? 0) * 1.5, 1),
              1
            );
          })
          .setGraphical(true)
          .setDynamicOutput(true),
      };
    });
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setStream(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setStatus('Camera is idle.');
  }, []);

  const processFrame = useCallback(() => {
    if (!streamRef.current) {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (filter !== 'none' && kernelsRef.current) {
      const kernel = kernelsRef.current[filter];
      if (kernel) {
        kernel.setOutput([canvas.width, canvas.height]);
        kernel(imageData);
        const newCanvas = kernel.canvas;
        ctx.drawImage(newCanvas, 0, 0);
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [filter]);

  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      return videoDevices;
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStatus('Starting camera...');
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('Camera access is not supported.');
        return;
      }

      await getCameras();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        return;
      }

      video.srcObject = mediaStream;
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        processFrame();
      };

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus('Camera running');
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Camera error';
      setStatus(message);
    }
  }, [facingMode, getCameras, processFrame]);

  const switchCamera = useCallback(async () => {
    if (!streamRef.current) {
      return;
    }
    stopStream();
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    await startCamera();
  }, [startCamera, stopStream]);

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    setCapturedPhoto(canvas.toDataURL('image/jpeg'));
  }, []);

  const downloadPhoto = useCallback(() => {
    if (!capturedPhoto) {
      return;
    }
    const link = document.createElement('a');
    link.download = `photo-${new Date().toISOString()}.jpg`;
    link.href = capturedPhoto;
    link.click();
  }, [capturedPhoto]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) {
      return;
    }
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return (
    <ToolLayout title="Camera" description="Live camera with GPU filters." badge="Apps">
      <div ref={containerRef} className="camera-shell">
        <div className="camera-media">
          <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
          <canvas ref={canvasRef} />
          {!stream ? <div className="camera-message">카메라가 꺼져있습니다</div> : null}
        </div>
        <div className="camera-controls">
          <select value={filter} onChange={event => setFilter(event.target.value as FilterType)}>
            <option value="none">필터 없음</option>
            <option value="grayscale">흑백</option>
            <option value="sepia">세피아</option>
            <option value="invert">색상 반전</option>
            <option value="brightness">밝기 증가</option>
          </select>
          <Button onClick={stream ? stopStream : startCamera}>{stream ? '카메라 끄기' : '카메라 켜기'}</Button>
          <Button onClick={capturePhoto} disabled={!stream}>
            사진 촬영
          </Button>
          <Button onClick={switchCamera} disabled={!stream || cameras.length < 2}>
            카메라 전환
          </Button>
          <Button onClick={downloadPhoto} disabled={!capturedPhoto}>
            사진 저장
          </Button>
          <Button onClick={toggleFullscreen}>{isFullscreen ? '전체화면 종료' : '전체화면'}</Button>
          <span className="muted">{status}</span>
        </div>
        {capturedPhoto ? <img src={capturedPhoto} alt="Captured" className="fill-parent-width" /> : null}
      </div>
    </ToolLayout>
  );
}
