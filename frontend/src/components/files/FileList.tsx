import type { DropboxFile } from "../../types";

interface Props {
  files: DropboxFile[];
  selectedPaths: Set<string>;
  onToggle: (path: string) => void;
  onToggleAll: () => void;
  onNavigate: (path: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileList({ files, selectedPaths, onToggle, onToggleAll, onNavigate }: Props) {
  if (files.length === 0) {
    return <p className="text-sm text-gray-500 py-4">ファイルが見つかりません</p>;
  }

  const imageFiles = files.filter((f) => !f.is_folder);
  const allSelected = imageFiles.length > 0 && imageFiles.every((f) => selectedPaths.has(f.path));

  return (
    <div className="border border-gray-200 rounded max-h-64 overflow-y-auto">
      {imageFiles.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="rounded"
            />
            すべて選択 ({imageFiles.length}件)
          </label>
        </div>
      )}
      {files.map((file) => (
        <div
          key={file.path}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
        >
          {file.is_folder ? (
            <button
              onClick={() => onNavigate(file.path)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <span>📁</span>
              {file.name}
            </button>
          ) : (
            <label className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedPaths.has(file.path)}
                onChange={() => onToggle(file.path)}
                className="rounded"
              />
              <span>🖼️</span>
              <span className="flex-1">{file.name}</span>
              <span className="text-gray-400 text-xs">{formatSize(file.size)}</span>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
