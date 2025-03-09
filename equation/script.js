document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const convertBtn = document.getElementById('convertBtn');
    const latexOutputText = document.getElementById('latexOutputText');
    const copyLatexBtn = document.getElementById('copyLatexBtn');
    const renderedOutput = document.getElementById('renderedOutput');
    const loading = document.getElementById('loading');
    
    const appIdInput = document.getElementById('appId');
    const appKeyInput = document.getElementById('appKey');

    let isDrawing = false;
    let isErasing = false;
    let strokes = [];
    let currentStroke = [];

    // 저장된 API Key 및 Secret 불러오기
    appIdInput.value = localStorage.getItem('mathpix_appId') || '';
    appKeyInput.value = localStorage.getItem('mathpix_appKey') || '';
    
    // 캔버스 초기화 함수
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        strokes = [];
        currentStroke = [];
        latexOutputText.textContent = 'Latex 코드가 여기 표시됩니다.';
        renderedOutput.innerHTML = '수식이 여기에 표시됩니다.';
    }
    
    // 초기 캔버스 설정
    clearCanvas();
    
    // 마우스 이벤트 처리
    canvas.addEventListener('mousedown', function(e) {
        isDrawing = true;
        if (isErasing) {
            eraseStroke(e);
        } else {
            startDrawing(e);
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        if (isDrawing) {
            if (isErasing) {
                eraseStroke(e);
            } else {
                draw(e);
            }
        }
    });

    canvas.addEventListener('mouseup', function() {
        isDrawing = false;
        if (currentStroke.length > 0) {
            strokes.push([...currentStroke]);
        }
        currentStroke = [];
    });

    canvas.addEventListener('mouseout', function() {
        isDrawing = false;
    });

    function eraseStroke(e) {
        const point = getPoint(e);
        const eraseRadius = 4; // 지우개 범위 (픽셀)
        
        strokes = strokes.filter(stroke =>
            !stroke.some(p =>
                Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2) < eraseRadius
            )
        );

        redrawCanvas();
    }

    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';

        strokes.forEach(stroke => {
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            stroke.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        });
    }

    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault(); // 마우스 오른쪽 클릭 메뉴 비활성화
    });
    
    eraserBtn.addEventListener('click', function() {
        isErasing = !isErasing;
        eraserBtn.textContent = isErasing ? '연필 모드' : '지우개 모드';
    });

    // 터치 이벤트 처리
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    function startDrawing(e) {
        currentStroke = [];
        const point = getPoint(e);
        currentStroke.push(point);
        
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const point = getPoint(e);
        currentStroke.push(point);
        
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }

    function getPoint(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; // 너비 비율
        const scaleY = canvas.height / rect.height; // 높이 비율
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    }
    
    // 버튼 클릭 이벤트
    clearBtn.addEventListener('click', clearCanvas);
    
    convertBtn.addEventListener('click', function() {
        if (strokes.length === 0) {
            alert('먼저 수식을 그려주세요!');
            return;
        }

        const appId = appIdInput.value.trim();
        const appKey = appKeyInput.value.trim();

        if (!appId || !appKey) {
            alert('API Key와 API Secret을 입력하세요.');
            return;
        }

        // 입력된 API 정보 자동 저장
        localStorage.setItem('mathpix_appId', appId);
        localStorage.setItem('mathpix_appKey', appKey);

        loading.style.display = 'block';
        
        // Mathpix API 요청
        convertToLatex(strokes, appId, appKey);
    });
    
    async function convertToLatex(strokes, appId, appKey) {
        try {
            const formattedStrokes = {
                strokes: {
                    x: strokes.map(stroke => stroke.map(point => point.x)),
                    y: strokes.map(stroke => stroke.map(point => point.y))
                }
            };
            
            const response = await fetch('https://api.mathpix.com/v3/strokes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'app_id': appId,
                    'app_key': appKey
                },
                body: JSON.stringify({
                    strokes: formattedStrokes,
                    formats: ["latex_styled"],
                    data_options: {
                        include_asciimath: true,
                        include_latex: true
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.latex_styled) {
                latexOutputText.textContent = data.latex_styled;
                renderLatex(data.latex_styled);
            } else if (data.error) {
                latexOutputText.textContent = `오류: ${data.error}`;
                renderedOutput.innerHTML = '오류가 발생했습니다.';
            } else {
                latexOutputText.textContent = '변환할 수 있는 수식을 찾을 수 없습니다.';
                renderedOutput.innerHTML = '인식된 수식이 없습니다.';
            }
        } catch (error) {
            console.error('Error:', error);
            latexOutputText.textContent = `API 오류: ${error.message}`;
            renderedOutput.innerHTML = '오류가 발생했습니다.';
        } finally {
            loading.style.display = 'none';
        }
    }
    
    function renderLatex(latex) {
        renderedOutput.innerHTML = `$$${latex}$$`;
        // MathJax를 사용하여 LaTeX 렌더링
        if (window.MathJax) {
            MathJax.typesetPromise([renderedOutput]).catch(function (err) {
                console.error('MathJax 오류:', err);
                renderedOutput.innerHTML = '수식 렌더링 중 오류가 발생했습니다.';
            });
        }
    }
});