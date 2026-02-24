import { DropboxAuthButton } from "../auth/DropboxAuthButton";

interface Props {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({ isAuthenticated, onLogin, onLogout }: Props) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">領収書スキャナー</h1>
        <DropboxAuthButton
          isAuthenticated={isAuthenticated}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
