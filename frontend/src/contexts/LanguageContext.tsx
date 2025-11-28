import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'en';

interface Translations {
  [key: string]: {
    ru: string;
    en: string;
  };
}

const translations: Translations = {
  login: { ru: 'Вход в систему', en: 'Login' },
  username: { ru: 'Имя пользователя', en: 'Username' },
  password: { ru: 'Пароль', en: 'Password' },
  enter: { ru: 'Войти', en: 'Enter' },
  loggingIn: { ru: 'Вход...', en: 'Logging in...' },
  logout: { ru: 'Выйти', en: 'Logout' },
  uploadData: { ru: 'Загрузка данных участников', en: 'Upload Participants Data' },
  uploadFile: { ru: 'Загрузка файла', en: 'Upload File' },
  templates: { ru: 'Управление шаблонами', en: 'Templates Management' },
  uploadTemplate: { ru: 'Загрузить новый шаблон', en: 'Upload New Template' },
  templateName: { ru: 'Название шаблона', en: 'Template Name' },
  templateType: { ru: 'Тип шаблона', en: 'Template Type' },
  availableTemplates: { ru: 'Доступные шаблоны', en: 'Available Templates' },
  generate: { ru: 'Генерация сертификатов', en: 'Certificate Generation' },
  generationSettings: { ru: 'Настройки генерации', en: 'Generation Settings' },
  selectTemplate: { ru: 'Шаблон сертификата', en: 'Certificate Template' },
  eventName: { ru: 'Название мероприятия', en: 'Event Name' },
  issueDate: { ru: 'Дата выдачи', en: 'Issue Date' },
  sendEmail: { ru: 'Отправить сертификаты по электронной почте', en: 'Send certificates by email' },
  emailSubject: { ru: 'Тема письма', en: 'Email Subject' },
  emailBody: { ru: 'Текст письма', en: 'Email Body' },
  statistics: { ru: 'Статистика', en: 'Statistics' },
  participants: { ru: 'Участников', en: 'Participants' },
  generateCertificates: { ru: 'Сгенерировать сертификаты', en: 'Generate Certificates' },
  generating: { ru: 'Генерация...', en: 'Generating...' },
  certificatesGenerated: { ru: 'Сертификаты успешно сгенерированы!', en: 'Certificates successfully generated!' },
  downloadZip: { ru: 'Скачать ZIP архив', en: 'Download ZIP Archive' },
  uploadedParticipants: { ru: 'Загруженные участники', en: 'Uploaded Participants' },
  fio: { ru: 'ФИО', en: 'Full Name' },
  email: { ru: 'Email', en: 'Email' },
  role: { ru: 'Роль', en: 'Role' },
  place: { ru: 'Место', en: 'Place' },
  actions: { ru: 'Действия', en: 'Actions' },
  delete: { ru: 'Удалить', en: 'Delete' },
  noParticipants: { ru: 'Нет загруженных участников', en: 'No participants uploaded' },
  noTemplates: { ru: 'Нет загруженных шаблонов', en: 'No templates uploaded' },
  dragFile: { ru: 'Перетащите файл сюда или', en: 'Drag file here or' },
  clickToSelect: { ru: 'нажмите для выбора', en: 'click to select' },
  supportedFormats: { ru: 'Поддерживаются форматы', en: 'Supported formats' },
  uploadDescription: { ru: 'Загрузите CSV или XLSX файл со списком участников. Файл должен содержать колонки: ФИО, Email, Роль (участник/докладчик/победитель/призер), Место (опционально).', en: 'Upload a CSV or XLSX file with a list of participants. The file must contain columns: Full Name, Email, Role (participant/speaker/winner/prize winner), Place (optional).' },
  templateDescription: { ru: 'Загрузите шаблоны сертификатов в формате SVG или HTML+CSS. Используйте плейсхолдеры для подстановки данных: {fio}, {email}, {role}, {place}, {event_name}, {issue_date}, {certificate_id}.', en: 'Upload certificate templates in SVG or HTML+CSS format. Use placeholders for data substitution: {fio}, {email}, {role}, {place}, {event_name}, {issue_date}, {certificate_id}.' },
  generationDescription: { ru: 'Настройте параметры генерации и создайте сертификаты для всех участников.', en: 'Configure generation settings and create certificates for all participants.' },
  serviceName: { ru: 'Сервис генерации сертификатов', en: 'Certificate Generation Service' },
  selected: { ru: 'Выбрано', en: 'Selected' },
  removeSelected: { ru: 'Удалить выбранные', en: 'Remove Selected' },
  save: { ru: 'Сохранить', en: 'Save' },
  cancel: { ru: 'Отменить', en: 'Cancel' },
  edit: { ru: 'Редактировать', en: 'Edit' },
  participantUpdated: { ru: 'Участник обновлен', en: 'Participant updated' },
  participantsRemoved: { ru: 'Удалено участников', en: 'Participants removed' },
  addParticipant: { ru: 'Добавить участника', en: 'Add Participant' },
  add: { ru: 'Добавить', en: 'Add' },
  fillRequiredFields: { ru: 'Заполните обязательные поля', en: 'Please fill in required fields' },
  participantAdded: { ru: 'Участник добавлен', en: 'Participant added' },
  showing: { ru: 'Показано', en: 'Showing' },
  of: { ru: 'из', en: 'of' },
  roleParticipant: { ru: 'участник', en: 'participant' },
  roleSpeaker: { ru: 'докладчик', en: 'speaker' },
  roleWinner: { ru: 'победитель', en: 'winner' },
  rolePrizeWinner: { ru: 'призер', en: 'prize winner' },
  exampleFileText: { ru: 'Пример файла с данными участников вы можете', en: 'You can download an example file with participant data' },
  downloadHere: { ru: 'скачать здесь', en: 'here' },
};

// Функция для получения переведенной роли
export const translateRole = (role: string, language: Language): string => {
  const roleMap: Record<string, keyof Translations> = {
    'участник': 'roleParticipant',
    'participant': 'roleParticipant',
    'докладчик': 'roleSpeaker',
    'speaker': 'roleSpeaker',
    'победитель': 'roleWinner',
    'winner': 'roleWinner',
    'призер': 'rolePrizeWinner',
    'prize winner': 'rolePrizeWinner',
  };
  
  const translationKey = roleMap[role.toLowerCase()];
  if (translationKey) {
    return translations[translationKey]?.[language] || role;
  }
  return role;
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export type { Language, Translations };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ru' ? 'en' : 'ru'));
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


