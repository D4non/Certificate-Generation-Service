import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { certificatesApi, CertificateTemplate } from '../api/certificates';
import { FileText, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'svg' | 'html'>('svg');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await certificatesApi.getTemplates();
      setTemplates(data);
    } catch (error: any) {
      toast.error('Ошибка при загрузке шаблонов');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (!templateName.trim()) {
      toast.error('Введите название шаблона');
      return;
    }

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const newTemplate = await certificatesApi.uploadTemplate(file, templateName, templateType);
      setTemplates([...templates, newTemplate]);
      setTemplateName('');
      toast.success('Шаблон успешно загружен');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при загрузке шаблона');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg'],
      'text/html': ['.html'],
    },
    maxFiles: 1,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;

    try {
      await certificatesApi.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
      toast.success('Шаблон удален');
    } catch (error: any) {
      toast.error('Ошибка при удалении шаблона');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center mb-3">
          <FileText className="h-6 w-6 text-gray-900 mr-2.5" />
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Управление шаблонами
          </h1>
        </div>
        <p className="text-sm text-gray-500 font-light">
          Загрузите шаблоны сертификатов в формате SVG или HTML+CSS. Используйте плейсхолдеры
          для подстановки данных: {'{fio}'}, {'{email}'}, {'{role}'}, {'{place}'}, {'{event_name}'}, {'{issue_date}'}, {'{certificate_id}'}.
        </p>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Загрузить новый шаблон
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Название шаблона
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
              placeholder="Например: Сертификат участника"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Тип шаблона
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as 'svg' | 'html')}
              className="w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
            >
              <option value="svg">SVG</option>
              <option value="html">HTML+CSS</option>
            </select>
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-300 hover:border-gray-900'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={uploading} />
            {uploading ? (
              <Loader2 className="mx-auto h-10 w-10 text-gray-900 animate-spin" />
            ) : (
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
            )}
            <p className="mt-3 text-sm text-gray-600 font-light">
              {isDragActive ? (
                <span className="text-gray-900 font-medium">Отпустите файл здесь</span>
              ) : (
                <>
                  Перетащите файл сюда или <span className="text-gray-900 font-medium">нажмите для выбора</span>
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Поддерживаются форматы: SVG, HTML
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Доступные шаблоны ({templates.length})
        </h2>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-light">
            Нет загруженных шаблонов
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 p-4 hover:border-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {template.type === 'svg' ? (
                      <ImageIcon className="h-5 w-5 text-gray-900 mr-2" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-900 mr-2" />
                    )}
                    <h3 className="font-medium text-gray-900 text-sm">
                      {template.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-light mb-2">
                  Тип: {template.type.toUpperCase()}
                </p>
                {template.preview_url && (
                  <div className="mt-2">
                    <img
                      src={template.preview_url}
                      alt={template.name}
                      className="w-full h-32 object-contain border border-gray-200"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

