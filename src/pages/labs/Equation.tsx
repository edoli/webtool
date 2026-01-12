import type { MouseEvent, TouchEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { ToolLayout } from '../../components/ToolLayout';
import { loadScriptOnce } from '../../utils/loadScript';

type Point = { x: number; y: number };

export function Equation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

  const [isErasing, setIsErasing] = useState(false);
  const [latex, setLatex] = useState('Latex 코드가 여기 표시됩니다.');
  const [rendered, setRendered] = useState('수식이 여기에 표시됩니다.');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [appId, setAppId] = useState(() => localStorage.getItem('mathpix_appId') || '');
  const [appKey, setAppKey] = useState(() => localStorage.getItem('mathpix_appKey') || '');

  useEffect(() => {
    loadScriptOnce('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js');
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setLatex('Latex 코드가 여기 표시됩니다.');
    setRendered('수식이 여기에 표시됩니다.');
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  const getPoint = useCallback((event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';

    strokesRef.current.forEach(stroke => {
      if (!stroke[0]) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
  }, []);

  const startDrawing = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      const point = getPoint(event);
      currentStrokeRef.current = [point];
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
    },
    [getPoint]
  );

  const draw = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      const point = getPoint(event);
      currentStrokeRef.current.push(point);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [getPoint]
  );

  const eraseStroke = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const point = getPoint(event);
      const eraseRadius = 4;
      strokesRef.current = strokesRef.current.filter(stroke =>
        !stroke.some(p => Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2) < eraseRadius)
      );
      redrawCanvas();
    },
    [getPoint, redrawCanvas]
  );

  const handlePointerDown = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (isErasing) {
        eraseStroke(event);
      } else {
        startDrawing(event);
      }
    },
    [eraseStroke, isErasing, startDrawing]
  );

  const handlePointerMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (event.buttons !== 1) {
        return;
      }
      if (isErasing) {
        eraseStroke(event);
      } else {
        draw(event);
      }
    },
    [draw, eraseStroke, isErasing]
  );

  const handlePointerUp = useCallback(() => {
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
    }
    currentStrokeRef.current = [];
  }, []);

  const handleTouch = useCallback(
    (event: TouchEvent<HTMLCanvasElement>) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const simulatedEvent = { clientX: touch.clientX, clientY: touch.clientY };
      if (event.type === 'touchstart') {
        if (isErasing) {
          eraseStroke(simulatedEvent);
        } else {
          startDrawing(simulatedEvent);
        }
      } else if (event.type === 'touchmove') {
        if (isErasing) {
          eraseStroke(simulatedEvent);
        } else {
          draw(simulatedEvent);
        }
      }
      if (event.type === 'touchend') {
        handlePointerUp();
      }
      event.preventDefault();
    },
    [draw, eraseStroke, handlePointerUp, isErasing, startDrawing]
  );

  const convertToLatex = useCallback(async () => {
    if (strokesRef.current.length === 0) {
      setMessage('먼저 수식을 그려주세요!');
      return;
    }
    if (!appId || !appKey) {
      setMessage('API Key와 API Secret을 입력하세요.');
      return;
    }

    localStorage.setItem('mathpix_appId', appId);
    localStorage.setItem('mathpix_appKey', appKey);

    setLoading(true);
    setMessage('');

    try {
      const formattedStrokes = {
        strokes: {
          x: strokesRef.current.map(stroke => stroke.map(point => point.x)),
          y: strokesRef.current.map(stroke => stroke.map(point => point.y)),
        },
      };

      const response = await fetch('https://api.mathpix.com/v3/strokes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          app_id: appId,
          app_key: appKey,
        },
        body: JSON.stringify({
          strokes: formattedStrokes,
          formats: ['latex_styled'],
          data_options: {
            include_asciimath: true,
            include_latex: true,
          },
        }),
      });

      const data = await response.json();

      if (data.latex_styled) {
        setLatex(data.latex_styled);
        setRendered(`$$${data.latex_styled}$$`);
        if (window.MathJax) {
          await window.MathJax.typesetPromise();
        }
      } else if (data.error) {
        setLatex(`오류: ${data.error}`);
        setRendered('오류가 발생했습니다.');
      } else {
        setLatex('변환할 수 있는 수식을 찾을 수 없습니다.');
        setRendered('인식된 수식이 없습니다.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLatex(`API 오류: ${message}`);
      setRendered('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [appId, appKey]);

  const copyLatex = useCallback(async () => {
    if (!latex.trim()) {
      setMessage('복사할 LaTeX 코드가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(latex);
      setMessage('LaTeX 코드가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error(error);
      setMessage('복사 중 오류가 발생했습니다.');
    }
  }, [latex]);

  return (
    <ToolLayout title="Scribble to LaTeX" description="Convert handwritten math to LaTeX." badge="Labs">
      <div className="equation-layout">
        <div className="stack">
          <div className="toolbar">
            <input
              type="text"
              placeholder="App ID"
              value={appId}
              onChange={event => setAppId(event.target.value)}
            />
            <input
              type="text"
              placeholder="App Key"
              value={appKey}
              onChange={event => setAppKey(event.target.value)}
            />
          </div>
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="equation-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={handleTouch}
          />
          <div className="toolbar">
            <Button onClick={() => setIsErasing(prev => !prev)}>
              {isErasing ? '연필 모드' : '지우개 모드'}
            </Button>
            <Button variant="outline" onClick={clearCanvas}>
              전체 지우기
            </Button>
            <Button onClick={convertToLatex}>수식으로 변환</Button>
            <Button variant="ghost" onClick={copyLatex}>
              LaTeX 복사
            </Button>
            {loading ? <span className="muted">변환 중입니다...</span> : null}
          </div>
          {message ? <div className="message-box">{message}</div> : null}
        </div>
        <div className="equation-output">
          <div className="latex-box">{latex}</div>
          <div className="render-box" dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>
      </div>
    </ToolLayout>
  );
}
