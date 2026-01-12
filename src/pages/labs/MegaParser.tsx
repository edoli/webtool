import { useCallback, useState } from 'react';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '../../components/Button';
import { ToolLayout } from '../../components/ToolLayout';

const columns = [
  '순위',
  '종합점수',
  'LEET',
  'GPA',
  '학부',
  '자교 순위',
  '타교 순위',
  '전공',
  '나이',
  '타군(대학)',
  '타군(일반/특별)',
  '어학점수',
  '(시험)종류',
  '봉사',
  '수상',
  '경력',
  '자격증',
  '논문',
];

export function MegaParser() {
  const [htmlInput, setHtmlInput] = useState('');
  const [csvOutput, setCsvOutput] = useState('');
  const [parsedData, setParsedData] = useState<Array<(string | number)[]>>([]);
  const [message, setMessage] = useState('');

  const parseTable = useCallback(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, 'text/html');
    const table = doc.querySelector('.tbl01');

    if (!table) {
      setMessage('No table with class "tbl01" found in the input HTML.');
      return;
    }

    const rows = table.querySelectorAll('tbody tr');
    const data: Array<(string | number)[]> = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      const rowData: (string | number)[] = [];

      rowData.push(cells[0]?.textContent?.trim() ?? '');
      rowData.push(parseScore(cells[1]?.textContent ?? ''));
      rowData.push(parseScore(cells[2]?.textContent ?? ''));
      rowData.push(parseScore(cells[4]?.textContent ?? ''));

      const univText = cells[6]?.textContent?.trim() ?? '';
      const univMatch = univText.match(/(.*?)\s*\(\s*(자교|타교)(\d+)등\s*\)/);
      const univName = univMatch?.[1] ?? univText;
      const univRankType = univMatch?.[2];
      const univRank = univMatch?.[3] ?? '';
      rowData.push(univName);
      rowData.push(univRankType === '자교' ? univRank : '');
      rowData.push(univRankType === '타교' ? univRank : '');

      const majorText = cells[7]?.textContent?.trim() ?? '';
      const majorMatch = majorText.match(/(.*?)\s*\(\s*(법학|비법학)(\d+)등\s*\)/);
      rowData.push(majorMatch?.[1] ?? majorText);

      rowData.push(cells[8]?.textContent?.trim() ?? '');

      const otherAppText = cells[9]?.textContent?.trim() ?? '';
      const otherAppMatch = otherAppText.match(/(.*?)\s*\(\s*(.*?)\s*\)/);
      rowData.push(otherAppMatch?.[1] ?? '');
      rowData.push(otherAppMatch?.[2] ?? '');

      const englishScoreText = cells[3]?.textContent?.trim() ?? '';
      const englishMatch = englishScoreText.match(/(\d+\.?\d*)점\s*\(\s*(.*?)\s*\)/);
      rowData.push(englishMatch?.[1] ? parseFloat(englishMatch[1]) : '');
      rowData.push(englishMatch?.[2] ?? '');

      const paperworkText = cells[5]?.textContent?.trim() ?? '';
      const paperworkItems = paperworkText.split('\n').map(item => item.trim());
      const paperworkData: Record<string, string> = {
        봉사: '',
        수상경력: '',
        경력: '',
        기타자격증: '',
        '대학원 논문': '',
      };

      paperworkItems.forEach(item => {
        const parts = item.split('] ');
        const key = parts[0];
        const value = parts[1];
        if (!key || !value) {
          return;
        }
        paperworkData[key.slice(1)] = value;
      });

      rowData.push(paperworkData['봉사'] ?? '');
      rowData.push(paperworkData['수상경력'] ?? '');
      rowData.push(paperworkData['경력'] ?? '');
      rowData.push(paperworkData['기타자격증'] ?? '');
      rowData.push(paperworkData['대학원 논문'] ?? '');

      data.push(rowData);
    });

    const csv = Papa.unparse({ fields: columns, data });
    setCsvOutput(csv);
    setParsedData(data);
    setMessage('Parsed successfully.');
  }, [htmlInput]);

  const downloadCSV = useCallback(() => {
    if (!csvOutput) {
      setMessage('Please parse the table first.');
      return;
    }
    const csvWithBom = `\uFEFF${csvOutput}`;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'table_data.csv';
    link.click();
  }, [csvOutput]);

  const downloadExcel = useCallback(() => {
    if (!parsedData.length) {
      setMessage('Please parse the table first.');
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet([columns, ...parsedData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'table_data.xlsx');
  }, [parsedData]);

  return (
    <ToolLayout title="Mega Parser" description="Parse HTML tables into CSV/Excel." badge="Labs">
      <div className="stack">
        <textarea
          value={htmlInput}
          onChange={event => setHtmlInput(event.target.value)}
          placeholder="Paste HTML content here..."
        />
        <div className="toolbar">
          <Button onClick={parseTable}>Parse Table</Button>
          <Button variant="outline" onClick={downloadCSV}>
            Download CSV
          </Button>
          <Button variant="outline" onClick={downloadExcel}>
            Download Excel
          </Button>
        </div>
        {message ? <div className="message-box">{message}</div> : null}
        <textarea value={csvOutput} readOnly placeholder="CSV output" />
      </div>
    </ToolLayout>
  );
}

function parseScore(scoreText: string) {
  const match = scoreText.match(/(\d+(?:\.\d+)?)/);
  return match?.[1] ? parseFloat(match[1]) : '';
}
