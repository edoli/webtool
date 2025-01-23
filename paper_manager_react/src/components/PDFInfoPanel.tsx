import React, { useEffect, useState } from 'react';

interface PDFInfoPanelProps {
  pdfFile: PDFFile;
  onChange: () => void;
}

const PDFInfoPanel: React.FC<PDFInfoPanelProps> = ({ pdfFile, onChange }) => {
  // link가 한개도 없으면 빈 문자열을 추가
  const [links, setLinks] = useState(pdfFile.links?.length ? pdfFile.links : ['']);
  const [note, setNote] = useState(pdfFile.note);
  
  useEffect(() => {
    setLinks(pdfFile.links?.length ? pdfFile.links : ['']);
    setNote(pdfFile.note);
  }, [pdfFile]);
  
  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    
    setLinks(newLinks);
    pdfFile.links = newLinks;
    onChange();
  };

  const handleLinkDelete = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    pdfFile.links = newLinks;
    onChange();
  };

  const handleLinkAdd = () => {
    const newLinks = [...links, ''];
    setLinks(newLinks);
    pdfFile.links = newLinks;
    onChange();
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    pdfFile.note = value;
    onChange();
  };

  return (
    <div className="pdf-info-panel side-panel-item">
      <h3>PDF 정보</h3>
      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
        <p><strong>파일 이름:</strong><br></br>{pdfFile.name}</p>
        <p><strong>마지막 수정일:</strong> {new Date(pdfFile.lastModified).toLocaleDateString()}</p>
        <p><strong>태그:</strong> {Array.from(pdfFile.tags).length > 0 ? Array.from(pdfFile.tags).join(', ') : '없음'}</p>
        <textarea 
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
        />
        <p><strong>링크:</strong></p>
        <div className="pdf-into-link-list">
          {links.map((link, index) => {
            const isLastEmpty = index === links.length;
            return (
              <div key={index} className="pdf-into-link-item">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  placeholder="링크 입력"
                />
                {!isLastEmpty && (
                  <div 
                    className="button"
                    onClick={() => handleLinkDelete(index)}
                  >
                    삭제
                  </div>
                )}
              </div>
            );
          })}
          <div className="button" onClick={handleLinkAdd}>
            링크 추가
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFInfoPanel;