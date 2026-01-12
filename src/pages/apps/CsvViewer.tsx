import { useCallback, useMemo, useState } from 'react';
import * as Papa from 'papaparse';
import { DropZone } from '../../components/DropZone';
import { ToolLayout } from '../../components/ToolLayout';

export function CsvViewer() {
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const hasData = rows.length > 0 && headers.length > 0;

  const handleFiles = useCallback((fileList: FileList) => {
    const file = fileList[0];
    if (!file) {
      return;
    }
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      setFileInfo('CSV 파일만 업로드 가능합니다.');
      return;
    }

    setFileInfo(`${file.name} • ${formatFileSize(file.size)}`);
    setLoading(true);

    Papa.parse<Record<string, string | number>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: result => {
        setRows(result.data || []);
        setHeaders(result.meta.fields || []);
        setLoading(false);
      },
      error: () => {
        setFileInfo('CSV 파일 처리 중 오류가 발생했습니다.');
        setLoading(false);
      },
    });
  }, []);

  const displayedRows = useMemo(() => rows.slice(0, 500), [rows]);

  return (
    <ToolLayout title="CSV Viewer" description="Inspect CSV tables quickly in the browser." badge="Apps">
      <div className="csv-viewer">
        <DropZone
          label="Drag and drop a CSV file here or click to select"
          hint="Large files will be previewed (first 500 rows)."
          accept=".csv"
          onFiles={handleFiles}
        />
        {fileInfo ? <div className="message-box">{fileInfo}</div> : null}
        {loading ? <div className="message-box">Processing CSV...</div> : null}
        {hasData ? (
          <div className="table-shell">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.map(header => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, index) => (
                    <tr key={index}>
                      {headers.map(header => (
                        <td key={header}>{String(row[header] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </ToolLayout>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
