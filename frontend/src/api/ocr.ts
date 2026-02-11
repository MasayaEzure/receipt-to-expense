const API_BASE = "/api";

export function startBatchProcess(
  accessToken: string,
  filePaths: string[],
  onProgress: (data: { completed: number; total: number; current_file: string }) => void,
  onResult: (data: import("../types").ReceiptResult) => void,
  onError: (data: { file_name: string; error: string }) => void,
  onDone: () => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/ocr/process-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_paths: filePaths, access_token: accessToken }),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("レスポンスボディを読み取れませんでした");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let eventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            switch (eventType) {
              case "progress":
                onProgress(data);
                break;
              case "result":
                onResult(data);
                break;
              case "error":
                onError(data);
                break;
              case "done":
                onDone();
                break;
            }
          } catch {
            // JSON パース失敗は無視して次の行へ
          }
          eventType = "";
        }
      }
    }
  }).catch((err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") {
      // ユーザーによるキャンセル — onDone で終了扱い
      onDone();
      return;
    }
    const message = err instanceof Error ? err.message : "不明なエラーが発生しました";
    onError({ file_name: "", error: message });
    onDone();
  });

  return controller;
}
