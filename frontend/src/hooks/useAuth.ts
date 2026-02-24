import { useState, useCallback, useEffect, useRef } from "react";
import { getAuthUrl, exchangeToken } from "../api/auth";
import type { AuthState } from "../types";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    accessToken: sessionStorage.getItem("dropbox_token"),
    isAuthenticated: !!sessionStorage.getItem("dropbox_token"),
  });
  const callbackHandled = useRef(false);

  const login = useCallback(async () => {
    const { auth_url, state } = await getAuthUrl();
    sessionStorage.setItem("oauth_state", state);
    window.location.href = auth_url;
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    const savedState = sessionStorage.getItem("oauth_state");
    if (state !== savedState) {
      throw new Error("State mismatch");
    }
    const { access_token } = await exchangeToken(code, state);
    sessionStorage.setItem("dropbox_token", access_token);
    sessionStorage.removeItem("oauth_state");
    setAuth({ accessToken: access_token, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("dropbox_token");
    setAuth({ accessToken: null, isAuthenticated: false });
  }, []);

  // Handle OAuth callback on mount (guard against StrictMode double-invoke)
  useEffect(() => {
    if (callbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state) {
      callbackHandled.current = true;
      handleCallback(code, state).then(() => {
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
  }, [handleCallback]);

  return { auth, login, logout };
}
