import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-brand-600 font-bold text-xl">Escritor</span>
            <span className="bg-brand-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              .AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-4 w-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 100 12A6 6 0 0010 2zm0 10a4 4 0 110-8 4 4 0 010 8z" />
                </svg>
                <span className="font-medium text-brand-600">{user.credits_balance}</span>
                <span>créditos</span>
              </div>
            )}

            {user && (
              <span className="text-sm text-gray-500 hidden sm:block">{user.username}</span>
            )}

            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
