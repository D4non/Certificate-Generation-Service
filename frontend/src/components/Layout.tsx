import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { Moon, Sun, Languages } from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success(language === 'ru' ? 'Вы вышли из системы' : 'You have logged out');
    navigate('/login');
  };

  const orgColor = organization?.primaryColor || '#5500d8';

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-white'
    }`}>
      <nav 
        className="border-b border-gray-100 dark:border-gray-800/50 transition-colors"
        style={{ 
          backgroundColor: orgColor,
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : orgColor
        }}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <span 
                className="text-2xl font-light tracking-tight"
                style={{ color: theme === 'dark' ? '#fff' : '#fff' }}
              >
                {language === 'ru' ? 'Сертификаты' : 'Certificates'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {/* Логотип организации */}
              {organization?.logoUrl && (
                <div className="mr-4">
                  <img 
                    src={organization.logoUrl} 
                    alt={organization.name}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              )}
              {!organization?.logoUrl && organization && (
                <div 
                  className="mr-4 px-4 py-2 rounded text-sm font-light"
                  style={{ 
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                    color: '#fff'
                  }}
                >
                  {organization.name}
                </div>
              )}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center w-10 h-10 text-sm font-light hover:bg-white/10 focus:outline-none transition-all rounded-md"
                style={{ color: '#fff' }}
                title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              >
                <Languages className="h-4 w-4" />
              </button>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-10 h-10 text-sm font-light hover:bg-white/10 focus:outline-none transition-all rounded-md"
                style={{ color: '#fff' }}
                title={theme === 'light' ? 'Темная тема' : 'Light theme'}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 h-10 text-sm font-light hover:bg-white/10 focus:outline-none transition-all rounded-md"
                style={{ color: '#fff' }}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-16 px-8 lg:px-12 transition-colors">
        {children}
      </main>
    </div>
  );
};

