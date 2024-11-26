
const loadData = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    let loader;

    switch (extension) {
        case 'exr':
            loader = loadEXR;
            break;
        case 'h5':
            loader = loadH5;
            break;
        case 'npy':
            loader = loadNPY;
            break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'tif':
        case 'tiff':
        case 'gif':
        case 'webp':
            loader = loadImage;
            break;
        default:
            showError('Unsupported file format. Please select a supported file type (EXR, H5, NPY, or common image formats).');
        return;
    }

    const startTime = performance.now();

    const imageData = await loader(file);

    // Read file as ArrayBuffer
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    return imageData;
}

const loadImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        const img = new Image();

        reader.onload = (event) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                // Initialize GPU kernel with image dimensions
                repackData.setOutput([imageData.width, imageData.height]);
                
                const data = new Float32Array(imageData.data.buffer);
                const repackedImageData = {
                    width: img.width,
                    height: img.height,
                    pixels: repackData(data, 1.0 / 255.0)
                };

                resolve(repackedImageData);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const loadEXR = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const exrImage = exrLoader.loadEXRStr(data.buffer);

    if (exrImage) {
        const channels = exrImage.channels();
        const channelsList = Array.from({ length: channels.length }, (_, i) => channels[i]);
        
        if (channelsList.includes('R') && channelsList.includes('G') && channelsList.includes('B')) {
            const width = exrImage.width;
            const height = exrImage.height;
            const totalPixels = width * height;
            
            // Create a combined RGB array
            const rPlane = exrImage.plane('R');
            const gPlane = exrImage.plane('G');
            const bPlane = exrImage.plane('B');
            
            // Initialize GPU kernel with image dimensions
            packRGB.setOutput([width, height]);

            // Store the current image data
            const imageData = {
                width: width,
                height: height,
                pixels: packRGB(rPlane, gPlane, bPlane)
            };

            return imageData;
        }
    }
    return undefined;
}

const loadH5 = async (file) => {

}

const loadNPY = async (file) => {

}