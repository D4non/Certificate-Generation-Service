import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ username, password });
      toast.success('Успешный вход в систему');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка входа. Проверьте логин и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-white'
    }`}>
      <div className="max-w-md w-full px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-light text-gray-950 dark:text-white tracking-tight mb-4">
            {t('login')}
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light">
            {t('uploadData')}
          </p>
        </div>
        <form className="space-y-10" onSubmit={handleSubmit}>
          <div className="space-y-8">
            <div>
              <label htmlFor="username" className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light"
                placeholder={t('username')}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light"
                placeholder={t('password')}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-5 px-6 bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-base font-light hover:bg-gray-900 dark:hover:bg-gray-100 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {t('loggingIn')}
                </>
              ) : (
                t('enter')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

