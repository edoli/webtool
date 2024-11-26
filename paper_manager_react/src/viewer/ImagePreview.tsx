import React, { useEffect, useRef } from 'react';
import { ImageData, ControlValues } from './types';
import { gpuContext } from './GPUContext';

interface ImagePreviewProps {
  imageData: ImageData;
  controls: ControlValues;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageData, controls }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;

    const processImageKernel = gpuContext.processImageKernel;
    processImageKernel.setOutput([imageData.width, imageData.height]);
    
    processImageKernel(
      imageData.pixels,
      imageData.width,
      imageData.height,
      controls.brightness,
      controls.exposure,
      controls.gamma
    );

    const canvas = processImageKernel.canvas;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
  }, [imageData, controls]);

  return (
    <canvas
      ref={canvasRef}
      width={imageData.width}
      height={imageData.height}
      className="preview-canvas"
    />
  );
};