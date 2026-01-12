import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { DropZone } from '../../components/DropZone';
import { ToolLayout } from '../../components/ToolLayout';
import { loadScriptOnce } from '../../utils/loadScript';

type FfmpegResult = {
  id: string;
  name: string;
  url: string;
  downloadName: string;
};

type FfmpegInstance = {
  load: () => Promise<void>;
  run: (...args: string[]) => Promise<void>;
  FS: {
    (command: 'writeFile', path: string, data: Uint8Array): void;
    (command: 'readFile', path: string): Uint8Array;
    (command: 'unlink', path: string): void;
  };
};
type FfmpegLibrary = {
  createFFmpeg: (options: { log: boolean }) => FfmpegInstance;
  fetchFile: (file: File) => Promise<Uint8Array>;
};
type WindowWithFfmpeg = Window & {
  FFmpeg?: FfmpegLibrary;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function MovToMp4() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('Select MOV files to convert.');
  const [results, setResults] = useState<FfmpegResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const ffmpegRef = useRef<FfmpegInstance | null>(null);

  useEffect(() => {
    return () => {
      results.forEach(item => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, [results]);

  const handleFiles = useCallback((fileList: FileList) => {
    const nextFiles = Array.from(fileList);
    setFiles(nextFiles);
    setStatus(`${nextFiles.length} file(s) selected. Click convert.`);
  }, []);

  const ensureFfmpeg = useCallback(async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }
    setStatus('Loading FFmpeg...');
    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.10.1/ffmpeg.min.js');
    const ffmpegLib = (window as WindowWithFfmpeg).FFmpeg;
    if (!ffmpegLib) {
      throw new Error('FFmpeg failed to load.');
    }
    const instance = ffmpegLib.createFFmpeg({ log: true });
    await instance.load();
    ffmpegRef.current = instance;
    return instance;
  }, []);

  const convertFiles = useCallback(async () => {
    if (!files.length) {
      setStatus('Select MOV files first.');
      return;
    }

    setProcessing(true);
    setResults(current => {
      current.forEach(item => {
        URL.revokeObjectURL(item.url);
      });
      return [];
    });

    try {
      const ffmpeg = await ensureFfmpeg();
      const ffmpegLib = (window as WindowWithFfmpeg).FFmpeg;
      if (!ffmpegLib) {
        throw new Error('FFmpeg is not available.');
      }
      const { fetchFile } = ffmpegLib;

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!file) {
          continue;
        }
        setStatus(`Converting ${file.name} (${index + 1}/${files.length})...`);
        const inputName = file.name;
        const outputName = `output-${index}.mp4`;

        ffmpeg.FS('writeFile', inputName, await fetchFile(file));
        await ffmpeg.run('-i', inputName, outputName);

        const data = ffmpeg.FS('readFile', outputName);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        const downloadName = file.name.replace(/\.mov$/i, '.mp4');

        setResults(prev => [
          ...prev,
          {
            id: createId(),
            name: file.name,
            url,
            downloadName,
          },
        ]);

        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);
      }

      setStatus('All files converted.');
    } catch (error) {
      setStatus('Conversion failed. Check the console for details.');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }, [ensureFfmpeg, files]);

  return (
    <ToolLayout title="MOV to MP4" description="Convert MOV files using FFmpeg WASM." badge="Converter">
      <div className="stack">
        <DropZone
          label="Drag and drop MOV files here or click to select files"
          hint="FFmpeg will run locally in your browser."
          accept=".mov"
          multiple
          onFiles={handleFiles}
        />
        <div className="toolbar">
          <Button onClick={convertFiles} disabled={processing}>
            {processing ? 'Converting...' : 'Convert'}
          </Button>
          <span className="muted">{status}</span>
        </div>
        <div className="preview-grid">
          {results.map(item => (
            <div key={item.id} className="file-item">
              <div className="file-info">
                <div className="file-name">{item.name}</div>
                <a href={item.url} download={item.downloadName} className="button button-outline">
                  Download MP4
                </a>
              </div>
              <video src={item.url} controls className="fill-parent-width" />
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
