import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ParticipantsTable } from '../components/ParticipantsTable';
import { Participant } from '../api/certificates';
import { Upload as UploadIcon } from 'lucide-react';

export const UploadPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleFileParsed = (parsedParticipants: Participant[]) => {
    setParticipants(parsedParticipants);
    // Сохраняем в localStorage для использования на странице генерации
    localStorage.setItem('participants', JSON.stringify(parsedParticipants));
  };

  const handleRemoveParticipant = (index: number) => {
    const updated = participants.filter((_, i) => i !== index);
    setParticipants(updated);
    localStorage.setItem('participants', JSON.stringify(updated));
  };

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center mb-3">
          <UploadIcon className="h-6 w-6 text-gray-900 mr-2.5" />
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Загрузка данных участников
          </h1>
        </div>
        <p className="text-sm text-gray-500 font-light">
          Загрузите CSV или XLSX файл со списком участников. Файл должен содержать колонки:
          ФИО, Email, Роль (участник/докладчик/победитель/призер), Место (опционально).
        </p>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Загрузка файла
        </h2>
        <FileUpload onFileParsed={handleFileParsed} />
      </div>

      {participants.length > 0 && (
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Загруженные участники ({participants.length})
          </h2>
          <ParticipantsTable
            participants={participants}
            onRemove={handleRemoveParticipant}
          />
        </div>
      )}
    </div>
  );
};

