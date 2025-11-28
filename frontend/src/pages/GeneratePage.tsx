import { useState, useEffect } from 'react';
import { certificatesApi, CertificateTemplate, Participant, CertificateGenerationRequest } from '../api/certificates';
import { Settings, Download, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const GeneratePage: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [eventName, setEventName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Ваш сертификат');
  const [emailBody, setEmailBody] = useState('Поздравляем! Ваш сертификат прикреплен к этому письму.');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    loadParticipants();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await certificatesApi.getTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0].id);
      }
    } catch (error: any) {
      toast.error('Ошибка при загрузке шаблонов');
    }
  };

  const loadParticipants = () => {
    // Загружаем участников из localStorage (сохранены на странице загрузки)
    const saved = localStorage.getItem('participants');
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error('Ошибка при загрузке участников из localStorage');
      }
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

    if (!eventName.trim()) {
      toast.error('Введите название мероприятия');
      return;
    }

    setGenerating(true);
    setGenerated(false);

    try {
      const request: CertificateGenerationRequest = {
        template_id: selectedTemplate,
        participants,
        event_name: eventName,
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

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center mb-3">
          <Settings className="h-6 w-6 text-gray-900 mr-2.5" />
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Генерация сертификатов
          </h1>
        </div>
        <p className="text-sm text-gray-500 font-light">
          Настройте параметры генерации и создайте сертификаты для всех участников.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Настройки генерации
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Шаблон сертификата
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Название мероприятия *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  placeholder="Например: Конференция по программированию 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Дата выдачи
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                />
                <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900 font-light">
                  Отправить сертификаты по электронной почте
                </label>
              </div>

              {sendEmail && (
                <div className="space-y-4 pl-6 border-l-2 border-gray-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Тема письма
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Текст письма
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Статистика
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 font-light">Участников:</span>
                <span className="font-medium text-gray-900">{participants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 font-light">Шаблонов:</span>
                <span className="font-medium text-gray-900">{templates.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Генерация
            </h2>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedTemplate || participants.length === 0 || !eventName}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Генерация...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Сгенерировать сертификаты
                </>
              )}
            </button>

            {generated && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-center text-gray-900">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  <span className="font-medium text-sm">Сертификаты успешно сгенерированы!</span>
                </div>
                {zipUrl && (
                  <button
                    onClick={handleDownloadZip}
                    className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Скачать ZIP архив
                  </button>
                )}
              </div>
            )}
          </div>

          {participants.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Участники ({participants.length})
              </h2>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200"
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {participant.fio}
                      </div>
                      <div className="text-xs text-gray-500 font-light">
                        {participant.email} • {participant.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

