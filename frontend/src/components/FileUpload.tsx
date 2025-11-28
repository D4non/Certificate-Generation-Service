import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Participant } from '../api/certificates';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  onFileParsed: (participants: Participant[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileParsed,
}) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Participant[]>([]);

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
        setParsedData(participants);
        onFileParsed(participants);
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
        setParsedData(participants);
        onFileParsed(participants);
        toast.success(`Загружено ${participants.length} участников`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при парсинге файла');
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        parseFile(selectedFile);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const removeFile = () => {
    setFile(null);
    setParsedData([]);
    onFileParsed([]);
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
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
          {t('supportedFormats')}: CSV, XLSX, XLS
        </p>
      </div>

      {file && (
        <div className="border-2 border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <File className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-base font-light text-gray-950 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {parsedData.length > 0 && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-light">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {parsedData.length} {t('participants')}
              </div>
            )}
            <button
              onClick={removeFile}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

