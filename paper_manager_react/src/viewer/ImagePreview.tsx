import React, { useEffect, useRef, useState } from 'react';
import { ImageData, ControlValues } from './types';
import { gpuContext } from './GPUContext';

interface ImagePreviewProps {
  imageData?: ImageData;
  controls: ControlValues;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageData, controls }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const targetElement = canvasContainerRef.current;
    if (!targetElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    resizeObserver.observe(targetElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const processImageKernel = gpuContext.processImageKernel;
    const canvas = processImageKernel.canvas;

    const container = canvasContainerRef.current;
    if (container && !container.contains(canvas)) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(canvas);
    }
    
    if (!imageData) return;

    const displayWidth = canvasContainerRef.current!.clientWidth;
    const displayHeight = canvasContainerRef.current!.clientHeight;

    const updateSize = () => {
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        processImageKernel.setOutput([displayWidth, displayHeight]);
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    }
    
    const startTime = performance.now();
    processImageKernel.setAfterBuild(() => {
      updateSize();
    });
    
    updateSize();

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

  }, [imageData, controls, canvasSize]);

  return (
    <div className="preview-container" ref={canvasContainerRef}></div>
  );
};