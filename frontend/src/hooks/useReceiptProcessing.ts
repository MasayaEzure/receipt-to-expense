import { useState, useCallback, useRef } from "react";
import { startBatchProcess } from "../api/ocr";
import type { ReceiptResult, ProcessingState } from "../types";

export function useReceiptProcessing() {
  const [results, setResults] = useState<ReceiptResult[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    completed: 0,
    total: 0,
    currentFile: null,
  });
  const controllerRef = useRef<AbortController | null>(null);

  const processFiles = useCallback(
    (accessToken: string, filePaths: string[]) => {
      setResults([]);
      setProcessing({
        isProcessing: true,
        completed: 0,
        total: filePaths.length,
        currentFile: null,
      });

      controllerRef.current = startBatchProcess(
        accessToken,
        filePaths,
        (progress) => {
          setProcessing((prev) => ({
            ...prev,
            completed: progress.completed,
            total: progress.total,
            currentFile: progress.current_file,
          }));
        },
        (result) => {
          setResults((prev) => [...prev, result]);
          setProcessing((prev) => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        },
        (error) => {
          setResults((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              file_name: error.file_name,
              file_path: "",
              company_name: null,
              amount: null,
              tax_amount: null,
              date: null,
              description: null,
              category: null,
              category_reason: null,
              confidence: null,
              error: error.error,
              is_manually_edited: false,
            },
          ]);
          setProcessing((prev) => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        },
        () => {
          setProcessing((prev) => ({
            ...prev,
            isProcessing: false,
            currentFile: null,
          }));
        },
      );
    },
    [],
  );

  const updateResult = useCallback((id: string, updates: Partial<ReceiptResult>) => {
    setResults((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates, is_manually_edited: true } : r,
      ),
    );
  }, []);

  const cancelProcessing = useCallback(() => {
    controllerRef.current?.abort();
    setProcessing((prev) => ({ ...prev, isProcessing: false, currentFile: null }));
  }, []);

  return { results, processing, processFiles, updateResult, cancelProcessing };
}
