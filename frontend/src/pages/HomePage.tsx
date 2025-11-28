import { Link } from 'react-router-dom';
import { FileText, Upload, Settings, Award, Mail, Shield, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: Upload,
      title: 'Загрузка данных',
      description: 'Импортируйте списки участников из CSV или XLSX файлов',
      link: '/upload',
    },
    {
      icon: FileText,
      title: 'Управление шаблонами',
      description: 'Создавайте и управляйте шаблонами сертификатов в формате SVG или HTML+CSS',
      link: '/templates',
    },
    {
      icon: Settings,
      title: 'Генерация сертификатов',
      description: 'Генерируйте PDF сертификаты для всех участников одним кликом',
      link: '/generate',
    },
    {
      icon: Mail,
      title: 'Email рассылка',
      description: 'Автоматическая отправка сертификатов участникам по электронной почте',
      link: '/generate',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Быстрая генерация',
      description: 'Создавайте сотни сертификатов за секунды',
    },
    {
      icon: Shield,
      title: 'Безопасность',
      description: 'Защищенное хранение данных и конфиденциальность информации',
    },
    {
      icon: Award,
      title: 'Профессиональный вид',
      description: 'Высококачественные PDF сертификаты с поддержкой кириллицы',
    },
  ];

  return (
    <div>
      <div className="text-center mb-16">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
          Сервис генерации сертификатов
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
          Создавайте профессиональные цифровые сертификаты для участников образовательных программ,
          научных конференций и спортивных мероприятий
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link
              key={index}
              to={feature.link}
              className="bg-white border border-gray-200 p-6 hover:border-gray-900 transition-colors group"
            >
              <div className="flex items-start">
                <div className="border border-gray-300 p-3 group-hover:border-gray-900 transition-colors">
                  <Icon className="h-5 w-5 text-gray-900" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-light">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 p-8 mb-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Преимущества сервиса</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="flex items-start">
                <Icon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-gray-900" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1 text-sm">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 font-light">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Как это работает
        </h2>
        <ol className="space-y-6">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 border-2 border-gray-900 text-gray-900 flex items-center justify-center font-semibold text-sm mr-4">
              1
            </span>
            <div>
              <h3 className="font-medium text-gray-900 mb-1.5 text-sm">
                Загрузите данные участников
              </h3>
              <p className="text-sm text-gray-500 font-light">
                Импортируйте CSV или XLSX файл со списком участников (ФИО, Email, Роль, Место)
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 border-2 border-gray-900 text-gray-900 flex items-center justify-center font-semibold text-sm mr-4">
              2
            </span>
            <div>
              <h3 className="font-medium text-gray-900 mb-1.5 text-sm">
                Выберите или загрузите шаблон
              </h3>
              <p className="text-sm text-gray-500 font-light">
                Используйте готовый шаблон или загрузите свой в формате SVG или HTML+CSS
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 border-2 border-gray-900 text-gray-900 flex items-center justify-center font-semibold text-sm mr-4">
              3
            </span>
            <div>
              <h3 className="font-medium text-gray-900 mb-1.5 text-sm">
                Настройте параметры и сгенерируйте
              </h3>
              <p className="text-sm text-gray-500 font-light">
                Укажите название мероприятия, дату и настройте отправку по email. Нажмите кнопку генерации
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 border-2 border-gray-900 text-gray-900 flex items-center justify-center font-semibold text-sm mr-4">
              4
            </span>
            <div>
              <h3 className="font-medium text-gray-900 mb-1.5 text-sm">
                Получите результат
              </h3>
              <p className="text-sm text-gray-500 font-light">
                Скачайте ZIP архив с сертификатами или они будут автоматически отправлены участникам
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
};

