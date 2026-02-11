import { useState, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useReceiptProcessing } from "./hooks/useReceiptProcessing";
import { listFiles } from "./api/dropbox";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { FolderSelector } from "./components/files/FolderSelector";
import { FileList } from "./components/files/FileList";
import { ProgressBar } from "./components/processing/ProgressBar";
import { ResultsTable } from "./components/results/ResultsTable";
import { CategorySummary } from "./components/results/CategorySummary";
import { ExportButton } from "./components/results/ExportButton";
import type { DropboxFile } from "./types";

function App() {
  const { auth, login, logout } = useAuth();
  const { results, processing, processFiles, updateResult, cancelProcessing } =
    useReceiptProcessing();

  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(
    async (path: string) => {
      if (!auth.accessToken) return;
      setIsLoadingFiles(true);
      setError(null);
      try {
        const { files: fetchedFiles } = await listFiles(auth.accessToken, path);
        setFiles(fetchedFiles);
        setSelectedPaths(new Set());
        setCurrentPath(path);
      } catch (e: any) {
        const detail = e?.response?.data?.detail || e?.message || "";
        setError(`ファイル一覧の取得に失敗しました: ${detail}`);
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [auth.accessToken],
  );

  const toggleFile = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const imageFiles = files.filter((f) => !f.is_folder);
    setSelectedPaths((prev) => {
      const allSelected = imageFiles.every((f) => prev.has(f.path));
      if (allSelected) return new Set();
      return new Set(imageFiles.map((f) => f.path));
    });
  }, [files]);

  const navigateFolder = useCallback(
    (path: string) => {
      loadFiles(path);
    },
    [loadFiles],
  );

  const handleProcess = useCallback(() => {
    if (!auth.accessToken || selectedPaths.size === 0) return;
    processFiles(auth.accessToken, Array.from(selectedPaths));
  }, [auth.accessToken, selectedPaths, processFiles]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        isAuthenticated={auth.isAuthenticated}
        onLogin={login}
        onLogout={logout}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {!auth.isAuthenticated ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-600">
              Dropbox に接続して領収書を読み取りましょう
            </p>
            <button
              onClick={login}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Dropbox に接続
            </button>
          </div>
        ) : (
          <>
            {/* File Selection Section */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
              <FolderSelector onLoad={loadFiles} isLoading={isLoadingFiles} />

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {files.length > 0 && (
                <>
                  <FileList
                    files={files}
                    selectedPaths={selectedPaths}
                    onToggle={toggleFile}
                    onToggleAll={toggleAll}
                    onNavigate={navigateFolder}
                  />

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleProcess}
                      disabled={selectedPaths.size === 0 || processing.isProcessing}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm"
                    >
                      選択したファイルを処理する ({selectedPaths.size}件)
                    </button>
                  </div>
                </>
              )}

              <ProgressBar processing={processing} onCancel={cancelProcessing} />
            </section>

            {/* Results Section */}
            {results.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
                <ResultsTable results={results} onUpdate={updateResult} />
                <CategorySummary results={results} />
                <div className="flex justify-end">
                  <ExportButton results={results} />
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
