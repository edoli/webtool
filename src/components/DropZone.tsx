import type { DragEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { clsx } from '../utils/clsx';

type DropZoneProps = {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onFiles: (files: FileList) => void;
};

export function DropZone({
  label,
  hint,
  accept,
  multiple,
  className,
  onFiles,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptText = useMemo(() => (accept ? `Accepted: ${accept}` : ''), [accept]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    onFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={clsx('drop-zone', dragging && 'dragover', className)}
      onClick={() => inputRef.current?.click()}
      onDragEnter={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={event => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={event => handleFiles(event.target.files)}
      />
      <div className="drop-zone__content">
        <strong>{label}</strong>
        {hint ? <span className="drop-zone__hint">{hint}</span> : null}
        {acceptText ? <span className="drop-zone__meta">{acceptText}</span> : null}
      </div>
    </div>
  );
}
