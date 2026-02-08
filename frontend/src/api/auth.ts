import apiClient from "./client";

export async function getAuthUrl(): Promise<{ auth_url: string; state: string }> {
  const { data } = await apiClient.get("/auth/dropbox/url");
  return data;
}

export async function exchangeToken(
  code: string,
  state: string,
): Promise<{ access_token: string }> {
  const { data } = await apiClient.post("/auth/dropbox/callback", { code, state });
  return data;
}
