import React, { useEffect, useRef } from 'react';
import { ImageData, ControlValues } from './types';
import { gpuContext } from './GPUContext';

interface ImagePreviewProps {
  imageData: ImageData;
  controls: ControlValues;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageData, controls }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageData) return;
    
    const startTime = performance.now();
    
    const processImageKernel = gpuContext.processImageKernel;
    const canvas = processImageKernel.canvas;

    if (!canvasContainerRef.current?.contains(canvas)) {
      canvasContainerRef.current?.appendChild(canvas);
    }
    
    processImageKernel.setOutput([imageData.width, imageData.height]);
    
    processImageKernel(
      imageData.pixels,
      imageData.width,
      imageData.height,
      controls.brightness,
      controls.exposure,
      controls.gamma
    );

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    console.log(`Update image time: ${updateTime.toFixed(2)}ms`);

  }, [imageData, controls]);

  return (
    <div className="preview-container" ref={canvasContainerRef}></div>
  );
};