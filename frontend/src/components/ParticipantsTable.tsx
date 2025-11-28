import { useState, useMemo } from 'react';
import { Participant } from '../api/certificates';
import { User, Mail, Award, Trophy, Edit2, Check, X, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useLanguage, translateRole } from '../contexts/LanguageContext';

interface EventRole {
  name: string;
  color: string;
}

interface ParticipantsTableProps {
  participants: Participant[];
  onRemove?: (index: number) => void;
  onUpdate?: (index: number, participant: Participant) => void;
  onRemoveMultiple?: (indices: number[]) => void;
  itemsPerPage?: number;
  eventRoles?: EventRole[];
}

export const ParticipantsTable: React.FC<ParticipantsTableProps> = ({
  participants,
  onRemove,
  onUpdate,
  onRemoveMultiple,
  itemsPerPage = 10,
  eventRoles,
}) => {
  const { t, language } = useLanguage();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Participant | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'fio' | 'role' | 'place' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (participants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-light">
        {t('noParticipants')}
      </div>
    );
  }

  const roleColors: Record<Participant['role'], string> = {
    участник: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    докладчик: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    победитель: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    призер: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
  };

  const roleStyles: Record<Participant['role'], string> = {
    участник: roleColors.участник,
    докладчик: roleColors.докладчик,
    победитель: roleColors.победитель,
    призер: roleColors.призер,
  };

  // Сортировка с сохранением оригинальных индексов
  const sortedParticipantsWithIndices = useMemo(() => {
    if (!sortField) {
      return participants.map((p, index) => ({ participant: p, originalIndex: index }));
    }

    const withIndices = participants.map((p, index) => ({ participant: p, originalIndex: index }));
    
    const sorted = [...withIndices].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'fio':
          comparison = a.participant.fio.localeCompare(b.participant.fio, language === 'ru' ? 'ru' : 'en');
          break;
        case 'role':
          const roleOrder: Record<Participant['role'], number> = {
            участник: 1,
            докладчик: 2,
            призер: 3,
            победитель: 4,
          };
          comparison = (roleOrder[a.participant.role] || 0) - (roleOrder[b.participant.role] || 0);
          break;
        case 'place':
          const placeA = a.participant.place ?? 999; // Участники без места в конец
          const placeB = b.participant.place ?? 999;
          comparison = placeA - placeB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [participants, sortField, sortDirection, language]);

  const sortedParticipants = sortedParticipantsWithIndices.map(item => item.participant);

  const handleSort = (field: 'fio' | 'role' | 'place') => {
    if (sortField === field) {
      // Если уже сортируем по этому полю, меняем направление
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Если новое поле, начинаем с возрастания
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Сбрасываем на первую страницу при сортировке
  };

  // Пагинация
  const totalPages = Math.ceil(sortedParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = sortedParticipants.slice(startIndex, endIndex);

  const handleEdit = (globalIndex: number) => {
    setEditingIndex(globalIndex);
    setEditData({ ...participants[globalIndex] });
  };

  const handleSave = (globalIndex: number) => {
    if (editData && onUpdate) {
      onUpdate(globalIndex, editData);
    }
    setEditingIndex(null);
    setEditData(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIndices(new Set());
      setSelectAll(false);
    } else {
      // Выбираем только участников на текущей странице (используем оригинальные индексы)
      const newSelected = new Set(selectedIndices);
      currentParticipants.forEach((_, localIndex) => {
        const sortedIndex = startIndex + localIndex;
        const originalIndex = sortedParticipantsWithIndices[sortedIndex]?.originalIndex ?? sortedIndex;
        newSelected.add(originalIndex);
      });
      setSelectedIndices(newSelected);
      setSelectAll(newSelected.size === participants.length);
    }
  };

  const handleSelect = (originalIndex: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(originalIndex)) {
      newSelected.delete(originalIndex);
    } else {
      newSelected.add(originalIndex);
    }
    setSelectedIndices(newSelected);
    // Проверяем, выбраны ли все на текущей странице (используем оригинальные индексы)
    const currentPageOriginalIndices = currentParticipants.map((_, localIndex) => {
      const sortedIndex = startIndex + localIndex;
      return sortedParticipantsWithIndices[sortedIndex]?.originalIndex ?? sortedIndex;
    });
    const allCurrentPageSelected = currentPageOriginalIndices.every(i => newSelected.has(i));
    setSelectAll(allCurrentPageSelected && newSelected.size === participants.length);
  };

  const handleRemoveMultiple = () => {
    if (onRemoveMultiple && selectedIndices.size > 0) {
      onRemoveMultiple(Array.from(selectedIndices));
      setSelectedIndices(new Set());
      setSelectAll(false);
      // Переходим на предыдущую страницу, если текущая стала пустой
      if (currentPage > 1 && currentPage > Math.ceil((participants.length - selectedIndices.size) / itemsPerPage)) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectAll(false);
  };

  return (
    <div className="space-y-6">
      {onRemoveMultiple && selectedIndices.size > 0 && (
        <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700">
          <span className="text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {t('selected')}: {selectedIndices.size}
          </span>
          <button
            onClick={handleRemoveMultiple}
            className="inline-flex items-center px-4 py-2 text-sm font-light text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('removeSelected')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              {onRemoveMultiple && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600 rounded"
                  />
                </th>
              )}
              <th 
                className="px-0 py-4 text-left text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-950 dark:hover:text-white transition-colors group relative"
                onClick={() => handleSort('fio')}
                title={t('clickToSort')}
              >
                <div className="flex items-center space-x-2">
                  <span>{t('fio')}</span>
                  {sortField === 'fio' ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-950 dark:text-white" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-950 dark:text-white" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
                  )}
                </div>
              </th>
              <th className="px-0 py-4 text-left text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {t('email')}
              </th>
              <th 
                className="px-0 py-4 text-left text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-950 dark:hover:text-white transition-colors group relative"
                onClick={() => handleSort('role')}
                title={t('clickToSort')}
              >
                <div className="flex items-center space-x-2">
                  <span>{t('role')}</span>
                  {sortField === 'role' ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-950 dark:text-white" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-950 dark:text-white" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                className="px-0 py-4 text-left text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-950 dark:hover:text-white transition-colors group relative"
                onClick={() => handleSort('place')}
                title={t('clickToSort')}
              >
                <div className="flex items-center space-x-2">
                  <span>{t('place')}</span>
                  {sortField === 'place' ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-950 dark:text-white" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-950 dark:text-white" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
                  )}
                </div>
              </th>
              <th className="px-0 py-4 text-right text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentParticipants.map((participant, localIndex) => {
              const sortedIndex = startIndex + localIndex;
              const originalIndex = sortedParticipantsWithIndices[sortedIndex]?.originalIndex ?? sortedIndex;
              const isEditing = editingIndex === originalIndex;
              const isSelected = selectedIndices.has(originalIndex);

              return (
                <tr
                  key={originalIndex}
                  className={`group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${
                    isSelected ? 'bg-accent/5' : ''
                  }`}
                >
                  {onRemoveMultiple && (
                    <td className="px-0 py-5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelect(originalIndex)}
                        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600 rounded"
                      />
                    </td>
                  )}
                  <td className="px-0 py-5 whitespace-nowrap align-top">
                    {isEditing && editData ? (
                      <input
                        type="text"
                        value={editData.fio}
                        onChange={(e) => setEditData({ ...editData, fio: e.target.value })}
                        className="w-full px-0 py-1 text-base border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors font-light"
                      />
                    ) : (
                      <span className="text-base font-light text-gray-950 dark:text-white">
                        {participant.fio}
                      </span>
                    )}
                  </td>
                  <td className="px-0 py-5 whitespace-nowrap align-top">
                    {isEditing && editData ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-0 py-1 text-base border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors font-light"
                      />
                    ) : (
                      <span className="text-base text-gray-600 dark:text-gray-400 font-light">
                        {participant.email}
                      </span>
                    )}
                  </td>
                  <td className="px-0 py-5 whitespace-nowrap align-top">
                    {isEditing && editData ? (
                      <select
                        value={editData.role}
                        onChange={(e) => setEditData({ ...editData, role: e.target.value as Participant['role'] })}
                        className="w-full px-0 py-1 text-base border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors font-light"
                      >
                        {eventRoles && eventRoles.length > 0 ? (
                          eventRoles.map((role) => (
                            <option key={role.name} value={role.name}>
                              {role.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="участник">{translateRole('участник', language)}</option>
                            <option value="докладчик">{translateRole('докладчик', language)}</option>
                            <option value="победитель">{translateRole('победитель', language)}</option>
                            <option value="призер">{translateRole('призер', language)}</option>
                          </>
                        )}
                      </select>
                    ) : (() => {
                      const roleColor = eventRoles?.find(r => r.name.toLowerCase() === participant.role.toLowerCase())?.color;
                      return (
                        <span
                          className={roleColor ? "inline-flex px-3 py-1 text-xs font-light border rounded-full" : `inline-flex px-3 py-1 text-xs font-light border rounded-full ${roleStyles[participant.role] || roleStyles['участник']}`}
                          style={roleColor ? {
                            backgroundColor: `${roleColor}20`,
                            borderColor: roleColor,
                            color: roleColor,
                          } : undefined}
                        >
                          {translateRole(participant.role, language)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-0 py-5 whitespace-nowrap align-top">
                    {isEditing && editData ? (
                      <input
                        type="number"
                        min="1"
                        value={editData.place || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setEditData({ ...editData, place: undefined });
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue > 0) {
                              setEditData({ ...editData, place: numValue });
                            }
                          }
                        }}
                        className="w-20 px-0 py-1 text-base border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white focus:outline-none focus:border-accent transition-colors font-light"
                        placeholder="—"
                      />
                    ) : (
                      <span className="text-base text-gray-600 dark:text-gray-400 font-light">
                        {participant.place ? (
                          <span className="text-gray-950 dark:text-white">{participant.place}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-0 py-5 whitespace-nowrap text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleSave(originalIndex)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title={t('save')}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title={t('cancel')}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onUpdate && (
                          <button
                            onClick={() => handleEdit(originalIndex)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            title={t('edit')}
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                        )}
                        {onRemove && (
                          <button
                            onClick={() => onRemove(originalIndex)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t-2 border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-light">
            {t('showing')} {startIndex + 1} - {Math.min(endIndex, sortedParticipants.length)} {t('of')} {sortedParticipants.length}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm font-light transition-colors ${
                        currentPage === page
                          ? 'text-gray-950 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400 dark:text-gray-600">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
