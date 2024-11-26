import { GPU, IKernelRunShortcut } from 'gpu.js';

class GPUContext {
  public repackData!: IKernelRunShortcut;
  public packRGB!: IKernelRunShortcut;
  public processImageKernel!: IKernelRunShortcut;

  constructor() {
    this.initializeKernels();
  }

  public initializeKernels() {
    const gpu = new GPU();

    gpu.addNativeFunction('process', `vec3 process(vec3 rgb, float brightness, float exposure, float gamma) {
      vec3 result = rgb + brightness;
      result *= exposure;
      result = clamp(result, vec3(0.0), vec3(1.0));
      result = pow(result, vec3(1.0 / gamma));
      return result;
    }`);

    gpu.addNativeFunction('float32ToVec4', `vec4 float32ToVec4(float val) {
      uint u = floatBitsToUint(val);
      vec4 bytes;
      bytes.x = float(u & 0xFFu);
      bytes.y = float((u >> 8) & 0xFFu);
      bytes.z = float((u >> 16) & 0xFFu);
      bytes.w = float((u >> 24) & 0xFFu);
      return bytes;
    }`);

    this.repackData = gpu.createKernel(function(data: number[], scale: number) {
      const i = (this.thread.y * this.output.x + this.thread.x);
      const t = (this as any).float32ToVec4(data[i]);
      return [t[0] * scale, t[1] * scale, t[2] * scale];
    }, {
      pipeline: true,
      dynamicOutput: true,
    });

    this.packRGB = gpu.createKernel(function(r: number[], g: number[], b: number[]) {
      const i = this.thread.y * this.output.x + this.thread.x;
      return [r[i], g[i], b[i]];
    }, {
      pipeline: true,
      dynamicOutput: true,
    });

    this.processImageKernel = gpu.createKernel(function(
      pixels: number[][],
      width: number,
      height: number,
      brightness: number,
      exposure: number,
      gamma: number
    ) {
      const x = this.thread.x;
      const y = height - this.thread.y - 1;
      const pixel = pixels[y][x];
      const final = (this as any).process(pixel, brightness, exposure, gamma);
      this.color(final[0], final[1], final[2], 1.0);
    }, {
      graphical: true,
      dynamicOutput: true,
    });
  }
}

export const gpuContext = new GPUContext();