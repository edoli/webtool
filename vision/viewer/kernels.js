const gpu = new GPU.GPU();
const cpu = new GPU.GPU({ mode: 'cpu' });

gpu.addNativeFunction('process', `vec3 process(vec3 rgb, float brightness, float exposure, float gamma) {
    vec3 result = rgb + brightness;        // 밝기 조정
    result *= exposure;                    // 노출 조정
    result = clamp(result, vec3(0.0), vec3(1.0));
    result = pow(result, vec3(1.0 / gamma)); // 감마 보정
    
    return result;
}`);

gpu.addNativeFunction('float32ToVec4', `vec4 float32ToVec4(float val) {
    uint u = floatBitsToUint(val);
    
    vec4 bytes;
    bytes.x = float(u & 0xFFu);         // 최하위 바이트
    bytes.y = float((u >> 8) & 0xFFu);  // 2번째 바이트
    bytes.z = float((u >> 16) & 0xFFu); // 3번째 바이트
    bytes.w = float((u >> 24) & 0xFFu); // 최상위 바이트
    
    return bytes;
}`);


const repackData = gpu.createKernel(function(data, scale) {
    const i = (this.thread.y * this.output.x + this.thread.x);
    const t = float32ToVec4(data[i]);
    return [t[0] * scale, t[1] * scale, t[2] * scale];
}).setPipeline(true).setDynamicOutput(true);


const packRGB = gpu.createKernel(function(r, g, b) {
    const i = this.thread.y * this.output.x + this.thread.x;
    return [r[i], g[i], b[i]];
}).setPipeline(true).setDynamicOutput(true);

const permuteData = gpu.createKernel(function(data, permute, dimension) {
    const i = this.thread.y * this.output.x + this.thread.x;

    let remainIndex = i;
    let originalIncides = [];
    for (let j = 0; j < dimension; j++) {
        const d = dimension[permute[j]];
        originalIncides.push(remainIndex / d);
        remainIndex = remainIndex % d;
    }

    let originalIndex = 0;
    let accumDim = 1;
    for (let j = 0; j < dimension; j++) {
        originalIndex += originalIncides[j] * accumDim;
        accumDim *= dimension[j];
    }

    return data[i];
}).setPipeline(true).setDynamicOutput(true);

// GPU kernel for image processing with combined RGB array
const processImageKernel = gpu.createKernel(function(pixels, width, height, brightness, exposure, gamma) {
    const x = this.thread.x;
    const y = height - this.thread.y - 1;
    
    const pixel = pixels[y][x];
    
    const final = process(pixel, brightness, exposure, gamma);

    this.color(final[0], final[1], final[2], 1.0);
}).setGraphical(true).setDynamicOutput(true);