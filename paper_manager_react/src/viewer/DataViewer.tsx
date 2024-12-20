import React, { useState, useCallback } from 'react';
import { DropZone } from './DropZone';
import { Controls } from './Controls';
import { ImagePreview } from './ImagePreview';
import { fileLoader } from './FileLoader';
import { ImageData, ControlValues } from './types';
import './style.css';

export const DataViewer: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData | undefined>(undefined);
  const [controls, setControls] = useState<ControlValues>({
    brightness: 0,
    exposure: 1,
    gamma: 1.0
  });
  const [error, setError] = useState<string>('');

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setError('');
      const data = await fileLoader.loadData(file);
      if (data) {
        setImageData(data);
      } else {
        setError('Failed to load image data');
      }
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  }, []);

  return (
    <div className="container">
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="main-container">
        <ImagePreview imageData={imageData} controls={controls} />
        <DropZone onFileSelect={handleFileSelect} />
      </div>
      
      <div className="sidebar">
        <Controls values={controls} onChange={setControls} />
        
        <div className="info-panel">
          <h3>Image Information</h3>
          <div className="image-info">
            <p>Width: {imageData?.width}px</p>
            <p>Height: {imageData?.height}px</p>
          </div>
        </div>
      </div>
    </div>
  );
};