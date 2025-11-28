import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { CertificateTemplate } from '../api/certificates';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, type: 'svg' | 'html', file: File) => Promise<void>;
  template?: CertificateTemplate | null;
  onUpdate?: (templateId: string, content: string) => Promise<void>;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
  onUpdate,
}) => {
  const { t } = useLanguage();
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'svg' | 'html'>('svg');
  const [file, setFile] = useState<File | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setTemplateName(template.name);
        setTemplateType(template.type as 'svg' | 'html');
        setIsEditing(true);
        setShowPreview(false);
        loadTemplateContent();
      } else {
        setTemplateName('');
        setTemplateType('svg');
        setFile(null);
        setTemplateContent('');
        setIsEditing(false);
        setShowPreview(false);
      }
    }
  }, [isOpen, template]);

  const loadTemplateContent = async () => {
    if (!template?.file_url) return;
    
    setLoadingContent(true);
    try {
      const response = await fetch(`http://localhost:8000${template.file_url}`);
      const content = await response.text();
      setTemplateContent(content);
    } catch (error) {
      toast.error('Ошибка при загрузке содержимого шаблона');
    } finally {
      setLoadingContent(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        const reader = new FileReader();
        reader.onload = (e) => {
          setTemplateContent(e.target?.result as string);
        };
        reader.readAsText(acceptedFiles[0]);
      }
    },
    accept: {
      'image/svg+xml': ['.svg'],
      'text/html': ['.html'],
    },
    maxFiles: 1,
    disabled: isEditing && !!template,
  });

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Введите название шаблона');
      return;
    }

    if (isEditing && template && onUpdate) {
      if (!templateContent.trim()) {
        toast.error('Содержимое шаблона не может быть пустым');
        return;
      }
      setSaving(true);
      try {
        // Обновляем через API
        const formData = new FormData();
        formData.append('content', templateContent);
        await apiClient.put(`/templates/${template.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await onUpdate(template.id, templateContent);
        toast.success('Шаблон обновлен');
        onClose();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Ошибка при обновлении шаблона');
      } finally {
        setSaving(false);
      }
    } else {
      if (!file && !templateContent.trim()) {
        toast.error('Загрузите файл шаблона');
        return;
      }
      setSaving(true);
      try {
        // Если есть файл, используем его, иначе создаем файл из содержимого
        let fileToUpload = file;
        if (!fileToUpload && templateContent.trim()) {
          const blob = new Blob([templateContent], { type: templateType === 'svg' ? 'image/svg+xml' : 'text/html' });
          fileToUpload = new File([blob], `${templateName}.${templateType}`, { type: blob.type });
        }
        if (fileToUpload) {
          await onSave(templateName, templateType, fileToUpload);
          toast.success('Шаблон сохранен');
          onClose();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Ошибка при сохранении шаблона');
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[95vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 px-8 py-6 flex items-center justify-between">
          <h3 className="text-2xl font-light text-gray-950 dark:text-white">
            {isEditing ? 'Редактирование шаблона' : 'Новый шаблон'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('templateName')}
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light"
                placeholder="Название шаблона"
              />
            </div>
            <div>
              <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('templateType')}
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as 'svg' | 'html')}
                disabled={isEditing}
                className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors text-base font-light disabled:opacity-50"
              >
                <option value="svg">SVG</option>
                <option value="html">HTML+CSS</option>
              </select>
            </div>
          </div>

          {/* Загрузка файла (только для нового шаблона) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                Файл шаблона
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-8 w-8 text-gray-500 dark:text-gray-400" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-light">
                  {isDragActive ? (
                    <span className="text-accent font-medium">{t('clickToSelect')}</span>
                  ) : (
                    <>
                      {t('dragFile')} <span className="text-accent font-medium">{t('clickToSelect')}</span>
                    </>
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {t('supportedFormats')}: SVG, HTML
                </p>
                {file && (
                  <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 font-light">
                    {file.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Редактор содержимого */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Содержимое шаблона
              </label>
              {templateContent && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-sm font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Скрыть превью
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Показать превью
                    </>
                  )}
                </button>
              )}
            </div>
            {loadingContent ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            ) : (
              <div className="w-full">
                <div className="border-2 border-gray-200 dark:border-gray-700 p-4 h-[600px] overflow-auto">
                  <textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="w-full h-full px-0 py-2 border-0 bg-transparent text-gray-950 dark:text-white focus:outline-none text-sm font-mono resize-none"
                    placeholder="Содержимое шаблона..."
                  />
                </div>
              </div>
            )}
            
            {/* Overlay превью поверх редактора */}
            {showPreview && templateContent && (
              <div className="absolute inset-0 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 z-10">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                  <h4 className="text-lg font-light text-gray-950 dark:text-white">
                    Превью шаблона
                  </h4>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 h-[calc(100%-73px)] overflow-auto bg-white dark:bg-gray-800">
                  {templateType === 'svg' ? (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: templateContent }}
                    />
                  ) : (
                    <iframe
                      srcDoc={templateContent}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-base font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !templateName.trim() || (!isEditing && !file) || (isEditing && !templateContent.trim())}
              className="px-6 py-3 bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-base font-light hover:bg-gray-900 dark:hover:bg-gray-100 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {isEditing ? 'Сохранить изменения' : 'Сохранить шаблон'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

