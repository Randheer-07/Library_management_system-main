import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center justify-between">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Welcome back, <span className="font-medium text-gray-900 dark:text-white">{user?.firstName}</span>!</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-gray-500" /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>

        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <Link to="/profile" className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
