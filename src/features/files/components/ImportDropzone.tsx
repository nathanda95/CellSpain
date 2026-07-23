import { useRef } from "react";
import { FolderOpen, Upload } from "lucide-react";

export function ImportDropzone({ onImport }: { onImport: (files: FileList | File[]) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <section
      className="import-area"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onImport(event.dataTransfer.files);
      }}
      onClick={() => fileInput.current?.click()}
    >
      <input
        ref={fileInput}
        hidden
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        multiple
        onChange={(event) => event.target.files && onImport(event.target.files)}
      />
      <span className="upload">
        <Upload size={27} />
      </span>
      <h2>Drop your files here</h2>
      <p>or select files from your computer</p>
      <button
        className="primary"
        onClick={(event) => {
          event.stopPropagation();
          fileInput.current?.click();
        }}
      >
        <FolderOpen size={17} /> Browse files
      </button>
      <small>Accepted formats: XLSX, CSV, JSON</small>
    </section>
  );
}
