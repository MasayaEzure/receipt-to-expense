import type { ProcessingState } from "../../types";

interface Props {
  processing: ProcessingState;
  onCancel: () => void;
}

export function ProgressBar({ processing, onCancel }: Props) {
  if (!processing.isProcessing && processing.completed === 0) return null;

  const percent =
    processing.total > 0
      ? Math.round((processing.completed / processing.total) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">
          {processing.isProcessing
            ? `${processing.completed}/${processing.total} 処理中...`
            : `${processing.completed}/${processing.total} 完了`}
        </span>
        {processing.isProcessing && (
          <button
            onClick={onCancel}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            キャンセル
          </button>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {processing.currentFile && (
        <p className="text-xs text-gray-500">
          処理中: {processing.currentFile}
        </p>
      )}
    </div>
  );
}
