import React from 'react';

interface PDFInfoPanelProps {
  pdfFile: PDFFile;
  onChange: () => void;
}

const PDFInfoPanel: React.FC<PDFInfoPanelProps> = ({ pdfFile, onChange }) => {
  return (
    <div className="pdf-info-panel side-panel-item">
      <h3>PDF 정보</h3>
      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
        <p><strong>파일 이름:</strong><br></br>{pdfFile.name}</p>
        <p><strong>마지막 수정일:</strong> {new Date(pdfFile.lastModified).toLocaleDateString()}</p>
        <p><strong>태그:</strong> {Array.from(pdfFile.tags).length > 0 ? Array.from(pdfFile.tags).join(', ') : '없음'}</p>
        <textarea 
          value={pdfFile.note || ""} 
          onChange={(e) => {
            pdfFile.note = e.target.value;
            onChange();
          }}
        ></textarea>
      </div>
    </div>
  );
};

export default PDFInfoPanel; 