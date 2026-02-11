import apiClient from "./client";
import type { DropboxFile } from "../types";

export async function listFiles(
  accessToken: string,
  path: string,
): Promise<{ files: DropboxFile[] }> {
  const { data } = await apiClient.post("/dropbox/list", {
    access_token: accessToken,
    path,
  });
  return data;
}

export async function downloadFile(
  accessToken: string,
  filePath: string,
): Promise<{ file_name: string; data_base64: string; media_type: string }> {
  const { data } = await apiClient.post("/dropbox/download", {
    access_token: accessToken,
    file_path: filePath,
  });
  return data;
}
