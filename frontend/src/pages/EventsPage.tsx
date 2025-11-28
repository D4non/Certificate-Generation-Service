import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, Event } from '../api/events';
import { Plus, Calendar, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';

export const EventsPage: React.FC = () => {
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const orgColor = organization?.primaryColor || '#5500d8';
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getAll();
      console.log('Loaded events:', data);
      setEvents(data);
    } catch (error: any) {
      console.error('Ошибка при загрузке мероприятий:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при загрузке мероприятий';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      toast.error('Введите название мероприятия');
      return;
    }

    try {
      const newEvent = await eventsApi.create({
        name: eventName,
        description: eventDescription || undefined,
      });
      setShowCreateModal(false);
      setEventName('');
      setEventDescription('');
      // Перезагружаем список мероприятий с сервера
      await loadEvents();
      toast.success('Мероприятие создано');
    } catch (error: any) {
      console.error('Ошибка при создании мероприятия:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при создании мероприятия';
      toast.error(errorMessage);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventName.trim()) {
      toast.error('Введите название мероприятия');
      return;
    }

    try {
      const updated = await eventsApi.update(editingEvent.id, {
        name: eventName,
        description: eventDescription || undefined,
      });
      setEvents(events.map(e => e.id === editingEvent.id ? updated : e));
      setEditingEvent(null);
      setEventName('');
      setEventDescription('');
      toast.success('Мероприятие обновлено');
    } catch (error: any) {
      toast.error('Ошибка при обновлении мероприятия');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      return;
    }

    try {
      await eventsApi.delete(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Мероприятие удалено');
    } catch (error: any) {
      toast.error('Ошибка при удалении мероприятия');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventName(event.name);
    setEventDescription(event.description || '');
    setShowCreateModal(true);
  };

  const handleOpenEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-24">
      {/* Заголовок и кнопка создания */}
      <section>
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-950 dark:text-white tracking-tight mb-4">
            Мероприятия
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl">
            Управляйте мероприятиями вашей организации. Для каждого мероприятия вы можете загружать участников, выбирать шаблоны и генерировать сертификаты.
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => {
              setEditingEvent(null);
              setEventName('');
              setEventDescription('');
              setShowCreateModal(true);
            }}
            className="flex items-center px-6 py-4 text-base font-light focus:outline-none transition-all"
            style={{
              backgroundColor: orgColor,
              color: '#fff',
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать мероприятие
          </button>
        </div>
      </section>

      {/* Список мероприятий */}
      <section>
        {events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
              Пока нет мероприятий
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-light mt-2">
              Создайте первое мероприятие, чтобы начать работу
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group"
                onClick={() => handleOpenEvent(event.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-light text-gray-950 dark:text-white group-hover:opacity-80 transition-opacity">
                    {event.name}
                  </h3>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 font-light">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(event.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Модальное окно создания/редактирования */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl border-2 border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-light text-gray-950 dark:text-white">
                {editingEvent ? 'Редактировать мероприятие' : 'Создать мероприятие'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEvent(null);
                  setEventName('');
                  setEventDescription('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Название мероприятия <span className="text-gray-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light"
                  placeholder="Название мероприятия"
                  style={{ '--tw-focus-ring-color': orgColor } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Описание (необязательно)
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={4}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light resize-none"
                  placeholder="Описание мероприятия"
                  style={{ '--tw-focus-ring-color': orgColor } as React.CSSProperties}
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    setEventName('');
                    setEventDescription('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-base font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
                  style={{
                    borderColor: orgColor,
                    color: orgColor,
                  }}
                >
                  Отменить
                </button>
                <button
                  onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                  className="px-6 py-3 text-base font-light focus:outline-none transition-all flex items-center"
                  style={{
                    backgroundColor: orgColor,
                    color: '#fff',
                  }}
                >
                  <Check className="h-5 w-5 mr-2" />
                  {editingEvent ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

