
import { ImageData } from './types.js';
import { gpuContext } from './GPUContext.js';
import npyjs from "npyjs";
import { exr } from './exr-wrap.js';

type ImageLoader = (file: File) => Promise<ImageData | undefined>;

let exrLoader: any;
exr.then((loader: any) => exrLoader = loader);

class FileLoader {
  loadData: ImageLoader = async (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    let loader: ImageLoader;

    switch (extension) {
      case 'exr':
        loader = this.loadEXR;
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        loader = this.loadImage;
        break;
      case 'npy':
      case 'np':
        loader = this.loadNPY;
        break;
      default:
        throw new Error('Unsupported file format');
    }

    const startTime = performance.now();
    const imageData = await loader(file);
    const endTime = performance.now();
    
    console.log(`Load time: ${endTime - startTime}ms`);
    return imageData;
  }

  loadImage: ImageLoader = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const img = new Image();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);

          const repackData = gpuContext.repackData;
          repackData.setOutput([imageData.width, imageData.height]);
          
          const data = new Float32Array(imageData.data.buffer);
          const repackedImageData: ImageData = {
            width: img.width,
            height: img.height,
            pixels: repackData(data, 1.0 / 255.0)
          };

          resolve(repackedImageData);
        };

        const target = event.target;
        if (target) {
          img.src = target.result as string;
        } else {
          console.error('Failed to load image file.');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  loadEXR: ImageLoader = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const exrImage = exrLoader.loadEXRStr(data.buffer);

    if (exrImage) {
      const channels = exrImage.channels();
      const channelsList = Array.from({ length: channels.length }, (_, i) => channels[i]);
      
      if (channelsList.includes('R') && channelsList.includes('G') && channelsList.includes('B')) {
        const width = exrImage.width;
        const height = exrImage.height;
        
        const rPlane = exrImage.plane('R');
        const gPlane = exrImage.plane('G');
        const bPlane = exrImage.plane('B');
        
        const packRGB = gpuContext.packRGB;
        packRGB.setOutput([width, height]);

        const imageData: ImageData = {
          width,
          height,
          pixels: packRGB(rPlane, gPlane, bPlane)
        };

        return imageData;
      }
    }
    return undefined;
  }

  loadNPY: ImageLoader = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const npyReader = new npyjs();
    const npyData = await npyReader.load(arrayBuffer);

    if (npyData && npyData.shape.length === 3) {
      const [, height, width] = npyData.shape;
      
      const permuteRGB = gpuContext.permuteRGB;
      permuteRGB.setOutput([width, height]);

      const imageData: ImageData = {
        width,
        height,
        pixels: permuteRGB(npyData.data as any, [1, 2, 0], npyData.shape, npyData.shape.length)
      };
      
      return imageData;
    }
    return undefined;

  }
}

export const fileLoader = new FileLoader();