import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { certificatesApi, CertificateTemplate, Participant, CertificateGenerationRequest } from '../api/certificates';
import { eventsApi, Event } from '../api/events';
import { ParticipantsTable } from '../components/ParticipantsTable';
import { TemplateModal } from '../components/TemplateModal';
import apiClient from '../api/client';
import { Download, Loader2, CheckCircle2, Trash2, Plus, X, Edit2, Upload, UserPlus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage, translateRole } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import * as XLSX from 'xlsx';

// Компонент формы добавления участника
const AddParticipantForm: React.FC<{ 
  onAdd: (participant: Participant) => void;
  onCancel?: () => void;
}> = ({ onAdd, onCancel }) => {
  const { t, language } = useLanguage();
  const { organization } = useOrganization();
  const orgColor = organization?.primaryColor || '#5500d8';
  const [formData, setFormData] = useState<Participant>({
    fio: '',
    email: '',
    role: 'участник',
    place: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fio.trim() || !formData.email.trim()) {
      toast.error(t('fillRequiredFields'));
      return;
    }
    onAdd(formData);
    setFormData({
      fio: '',
      email: '',
      role: 'участник',
      place: undefined,
    });
  };

  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 p-8">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {t('addParticipant')}
        </h4>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('fio')} <span className="text-gray-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fio}
              onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
              className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('email')} <span className="text-gray-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('role')}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Participant['role'] })}
              className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
            >
              <option value="участник">{translateRole('участник', language)}</option>
              <option value="докладчик">{translateRole('докладчик', language)}</option>
              <option value="победитель">{translateRole('победитель', language)}</option>
              <option value="призер">{translateRole('призер', language)}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('place')}
            </label>
            <input
              type="number"
              min="1"
              max="3"
              value={formData.place || ''}
              onChange={(e) => setFormData({ ...formData, place: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
              placeholder="—"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 pt-4">
          <button
            type="submit"
            className="px-6 py-4 text-white dark:text-gray-950 text-base font-light hover:opacity-90 dark:hover:bg-gray-100 focus:outline-none transition-all"
            style={{ backgroundColor: orgColor }}
          >
            {t('add')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-base font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export const MainPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [templatePreviews, setTemplatePreviews] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orgColor = organization?.primaryColor || '#5500d8';
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Сертификат для {имя}');
  const [emailBody, setEmailBody] = useState('Поздравляем {имя}!\n\nВы приняли участие в мероприятии "{название мероприятия}" в качестве {роль}.\n\nВаш сертификат прикреплен к этому письму.');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadTemplates();
      loadParticipants();
    } else {
      // Если нет eventId, перенаправляем на главную страницу
      navigate('/');
    }
  }, [eventId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await certificatesApi.getTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0].id);
        // Загружаем превью для всех шаблонов
        data.forEach(template => {
          if (template.file_url) {
            loadTemplatePreview(template.id);
          }
        });
      }
    } catch (error: any) {
      toast.error('Ошибка при загрузке шаблонов');
    } finally {
      setLoading(false);
    }
  };

  const loadEvent = async () => {
    if (!eventId) return;
    try {
      const eventData = await eventsApi.getById(eventId);
      setEvent(eventData);
    } catch (error: any) {
      toast.error('Ошибка при загрузке мероприятия');
      navigate('/');
    }
  };

  const loadParticipants = () => {
    if (!eventId) return;
    const saved = localStorage.getItem(`participants_${eventId}`);
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error('Ошибка при загрузке участников из localStorage');
      }
    }
  };

  const handleFileParsed = (parsedParticipants: Participant[]) => {
    if (!eventId) return;
    setParticipants(parsedParticipants);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(parsedParticipants));
  };

  const parseFile = async (file: File) => {
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        
        const participants: Participant[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          if (values.length >= 2) {
            participants.push({
              fio: values[0] || '',
              email: values[1] || '',
              role: (values[2] as Participant['role']) || 'участник',
              place: values[3] ? parseInt(values[3]) : undefined,
            });
          }
        }
        handleFileParsed(participants);
        toast.success(`Загружено ${participants.length} участников`);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (data.length < 2) {
          throw new Error('Файл должен содержать заголовки и хотя бы одну строку данных');
        }

        const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
        const fioIndex = headers.findIndex((h) => h.includes('фио') || h.includes('fio') || h.includes('имя'));
        const emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('почта') || h.includes('mail'));
        const roleIndex = headers.findIndex((h) => h.includes('роль') || h.includes('role'));
        const placeIndex = headers.findIndex((h) => h.includes('место') || h.includes('place'));

        if (fioIndex === -1 || emailIndex === -1) {
          throw new Error('Файл должен содержать колонки "ФИО" и "Email"');
        }

        const participants: Participant[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row && row[fioIndex] && row[emailIndex]) {
            participants.push({
              fio: String(row[fioIndex] || '').trim(),
              email: String(row[emailIndex] || '').trim(),
              role: (row[roleIndex] as Participant['role']) || 'участник',
              place: row[placeIndex] ? parseInt(String(row[placeIndex])) : undefined,
            });
          }
        }
        handleFileParsed(participants);
        toast.success(`Загружено ${participants.length} участников`);
      } else {
        throw new Error('Неподдерживаемый формат файла. Используйте CSV или XLSX');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при парсинге файла');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseFile(file);
    }
    // Сброс input, чтобы можно было выбрать тот же файл снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadExample = () => {
    // Создаем пример CSV файла
    const exampleData = [
      ['ФИО', 'Email', 'Роль', 'Место'],
      ['Иванов Иван Иванович', 'ivanov@example.com', 'участник', ''],
      ['Петрова Мария Сергеевна', 'petrova@example.com', 'докладчик', ''],
      ['Сидоров Алексей Петрович', 'sidorov@example.com', 'победитель', '1'],
      ['Козлова Анна Дмитриевна', 'kozlova@example.com', 'призер', '2'],
    ];

    // Конвертируем в CSV формат
    const csvContent = exampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Создаем Blob и скачиваем
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'example_participants.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveParticipant = (index: number) => {
    if (!eventId) return;
    const updated = participants.filter((_, i) => i !== index);
    setParticipants(updated);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(updated));
  };

  const handleUpdateParticipant = (index: number, updatedParticipant: Participant) => {
    if (!eventId) return;
    const updated = participants.map((p, i) => (i === index ? updatedParticipant : p));
    setParticipants(updated);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(updated));
    toast.success(t('participantUpdated'));
  };

  const handleRemoveMultipleParticipants = (indices: number[]) => {
    if (!eventId) return;
    const updated = participants.filter((_, i) => !indices.includes(i));
    setParticipants(updated);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(updated));
    toast.success(`${t('participantsRemoved')}: ${indices.length}`);
  };

  const loadTemplatePreview = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template?.file_url) return;

    try {
      const response = await fetch(`http://localhost:8000${template.file_url}`);
      if (response.ok) {
        const content = await response.text();
        setTemplatePreviews(prev => ({ ...prev, [templateId]: content }));
      }
    } catch (error) {
      console.error('Ошибка при загрузке превью шаблона:', error);
    }
  };

  const handleSaveTemplate = async (name: string, type: 'svg' | 'html', file: File) => {
    const newTemplate = await certificatesApi.uploadTemplate(file, name, type);
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    // Загружаем превью для нового шаблона
    if (newTemplate.file_url) {
      await loadTemplatePreview(newTemplate.id);
    }
  };

  const handleUpdateTemplate = async (templateId: string, content: string) => {
    const formData = new FormData();
    formData.append('content', content);
    await apiClient.put(`/templates/${templateId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Обновляем превью
    setTemplatePreviews(prev => ({ ...prev, [templateId]: content }));
    // Перезагружаем список шаблонов
    await loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;

    try {
      await certificatesApi.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
      toast.success('Шаблон удален');
    } catch (error: any) {
      toast.error('Ошибка при удалении шаблона');
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Выберите шаблон');
      return;
    }

    if (participants.length === 0) {
      toast.error('Нет участников для генерации сертификатов');
      return;
    }

    if (!event) {
      toast.error('Мероприятие не загружено');
      return;
    }

    setGenerating(true);
    setGenerated(false);

    try {
      const request: CertificateGenerationRequest = {
        template_id: selectedTemplate,
        participants,
        event_name: event.name,
        issue_date: issueDate,
        send_email: sendEmail,
        email_subject: sendEmail ? emailSubject : undefined,
        email_body: sendEmail ? emailBody : undefined,
      };

      const response = await certificatesApi.generateCertificates(request);
      
      if (response.zip_url) {
        setZipUrl(response.zip_url);
      }
      
      setGenerated(true);
      toast.success(`Успешно сгенерировано ${response.certificate_ids.length} сертификатов`);
      
      if (sendEmail) {
        toast.success('Сертификаты отправлены по электронной почте');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при генерации сертификатов');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = () => {
    if (zipUrl) {
      window.open(zipUrl, '_blank');
    }
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-24">
      {/* Заголовок мероприятия */}
      <section>
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к мероприятиям
          </button>
          <h1 className="text-4xl font-light text-gray-950 dark:text-white tracking-tight mb-2">
            {event.name}
          </h1>
          {event.description && (
            <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl">
              {event.description}
            </p>
          )}
        </div>
      </section>

      {/* Загрузка данных участников */}
      <section>
        <div className="mb-12">
          <h2 className="text-4xl font-light text-gray-950 dark:text-white tracking-tight mb-4">
            {t('uploadData')}
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl">
            {t('uploadDescription')}
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl mt-2">
            {t('exampleFileText')}{' '}
            <button
              onClick={handleDownloadExample}
              className="underline hover:opacity-70 transition-opacity"
              style={{ color: orgColor }}
            >
              {t('downloadHere')}
            </button>
            .
          </p>
        </div>

        {/* Кнопки загрузки и добавления */}
        <div className="flex items-center gap-4 mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="flex items-center px-6 py-4 text-white dark:text-gray-950 text-base font-light hover:opacity-90 dark:hover:bg-gray-100 focus:outline-none transition-all"
            style={{ backgroundColor: orgColor }}
          >
            <Upload className="h-5 w-5 mr-2" />
            {t('uploadFile')}
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-base font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            {t('addParticipant')}
          </button>
        </div>

        {/* Форма добавления нового участника */}
        {showAddForm && (
          <div className="mb-8">
            <AddParticipantForm 
              onAdd={(participant) => {
                if (!eventId) return;
                const updated = [...participants, participant];
                setParticipants(updated);
                localStorage.setItem(`participants_${eventId}`, JSON.stringify(updated));
                toast.success(t('participantAdded'));
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {participants.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-8">
              {t('uploadedParticipants')} · {participants.length}
            </h3>
            <ParticipantsTable
              participants={participants}
              onRemove={handleRemoveParticipant}
              onUpdate={handleUpdateParticipant}
              onRemoveMultiple={handleRemoveMultipleParticipants}
            />
          </div>
        )}
      </section>

      {/* Управление шаблонами */}
      <section>
        <div className="mb-12">
          <h2 className="text-4xl font-light text-gray-950 dark:text-white tracking-tight mb-4">
            {t('templates')}
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl">
            {t('templateDescription')}
          </p>
        </div>

        {/* Кнопка добавления шаблона */}
        <div className="mb-8">
          <button
            onClick={() => {
              setEditingTemplate(null);
              setTemplateModalOpen(true);
            }}
            className="flex items-center px-6 py-4 text-white dark:text-gray-950 text-base font-light hover:opacity-90 dark:hover:bg-gray-100 focus:outline-none transition-all"
            style={{ backgroundColor: orgColor }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Новый шаблон
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-light text-sm">
            {t('noTemplates')}
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-8">
              {t('availableTemplates')} · {templates.length}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group cursor-pointer"
                  onClick={() => {
                    setEditingTemplate(template);
                    setTemplateModalOpen(true);
                  }}
                >
                  {/* Превью шаблона */}
                  <div className="h-48 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                    {templatePreviews[template.id] ? (
                      template.type === 'svg' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: templatePreviews[template.id] }}
                          style={{ transform: 'scale(0.3)', transformOrigin: 'center' }}
                        />
                      ) : (
                        <iframe
                          srcDoc={templatePreviews[template.id]}
                          className="w-full h-full border-0 pointer-events-none"
                          style={{ transform: 'scale(0.3)', transformOrigin: 'top left', width: '333%', height: '333%' }}
                        />
                      )
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-sm font-light">
                        Загрузка превью...
                      </div>
                    )}
                  </div>
                  
                  {/* Информация о шаблоне */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-light text-gray-950 dark:text-white text-base mb-1">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                          {template.type.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template);
                            setTemplateModalOpen(true);
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Модальное окно для загрузки/редактирования шаблона */}
        <TemplateModal
          isOpen={templateModalOpen}
          onClose={() => {
            setTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
          template={editingTemplate}
          onUpdate={handleUpdateTemplate}
        />
      </section>

      {/* Генерация сертификатов */}
      <section>
        <div className="mb-16">
          <h2 className="text-4xl font-light text-gray-950 dark:text-white tracking-tight mb-4">
            {t('generate')}
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl">
            {t('generationDescription')}
          </p>
        </div>

        <div className="space-y-12">
          {/* Основные настройки */}
          <div className="space-y-8">
            <h3 className="text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Основные настройки
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t('selectTemplate')}
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
                >
                  <option value="">Выберите шаблон</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t('issueDate')}
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
                />
              </div>
            </div>

          </div>

          {/* Настройки email */}
          <div className="space-y-8">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-400 rounded"
              />
              <label htmlFor="sendEmail" className="ml-3 block text-sm text-gray-700 dark:text-gray-300 font-light">
                {t('sendEmail')}
              </label>
            </div>

            {sendEmail && (
              <div className="space-y-8 pl-6 border-l-2 border-gray-300 dark:border-gray-600">
                <div>
                  <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {t('emailSubject')}
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light"
                    placeholder="Сертификат для {имя}"
                  />
                </div>

                <div>
                  <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {t('emailBody')}
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light resize-none"
                    placeholder="Поздравляем {имя}! Вы заняли на {название мероприятия} {место} место. Это отличный результат!"
                  />
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-light">
                    Доступные плейсхолдеры:{' '}
                    <span className="font-mono text-gray-600 dark:text-gray-300">
                      {'{имя}'}, {'{email}'}, {'{роль}'}, {'{место}'}, {'{название мероприятия}'}, {'{дата}'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Кнопка генерации */}
          <div className="pt-8 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedTemplate || participants.length === 0}
              className="w-full flex items-center justify-center px-8 py-6 text-white dark:text-gray-950 text-lg font-light hover:opacity-90 dark:hover:bg-gray-100 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: orgColor }}
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-3" />
                  <span>{t('generating')}</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-3" />
                  <span>{t('generateCertificates')}</span>
                </>
              )}
            </button>
          </div>

          {/* Результат генерации */}
          {generated && (
            <div className="pt-8 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-gray-700 dark:text-gray-300 mb-8">
                <CheckCircle2 className="h-6 w-6 mr-3" />
                <span className="text-lg font-light">{t('certificatesGenerated')}</span>
              </div>
              {zipUrl && (
                <button
                  onClick={handleDownloadZip}
                  className="w-full flex items-center justify-center px-8 py-5 border-2 border-gray-300 dark:border-gray-600 text-base font-light text-gray-950 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <Download className="h-5 w-5 mr-3" />
                  {t('downloadZip')}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
