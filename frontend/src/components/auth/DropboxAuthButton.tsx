interface Props {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function DropboxAuthButton({ isAuthenticated, onLogin, onLogout }: Props) {
  if (isAuthenticated) {
    return (
      <button
        onClick={onLogout}
        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
      >
        Dropbox 接続解除
      </button>
    );
  }

  return (
    <button
      onClick={onLogin}
      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Dropbox に接続
    </button>
  );
}
