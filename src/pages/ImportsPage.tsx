import type { ImportItem } from "../features/files/file.types";
import { ImportDropzone } from "../features/files/components/ImportDropzone";
import { ImportHistory } from "../features/files/components/ImportHistory";

export function ImportsPage({
  imports,
  onImport,
  onRemove,
}: {
  imports: ImportItem[];
  onImport: (files: FileList | File[]) => void;
  onRemove: (item: ImportItem) => void;
}) {
  return (
    <>
      <div className="title">
        <div>
          <h1>Import data</h1>
          <p>Files remain on this device. No information is sent online.</p>
        </div>
      </div>
      <ImportDropzone onImport={onImport} />
      <ImportHistory imports={imports} onRemove={onRemove} />
    </>
  );
}
