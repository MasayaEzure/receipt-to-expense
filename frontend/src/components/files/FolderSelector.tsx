import { useState } from "react";

interface Props {
  onLoad: (path: string) => void;
  isLoading: boolean;
}

export function FolderSelector({ onLoad, isLoading }: Props) {
  const [path, setPath] = useState("");

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        フォルダパス:
      </label>
      <input
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="/領収書/2024-01"
        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => onLoad(path)}
        disabled={isLoading}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
      >
        {isLoading ? "読み込み中..." : "読み込み"}
      </button>
    </div>
  );
}
