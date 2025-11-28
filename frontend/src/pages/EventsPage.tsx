import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, Event } from '../api/events';
import { Plus, Calendar, Trash2, Edit2, X, Check, Loader2, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';

export const EventsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const orgColor = organization?.primaryColor || '#5500d8';
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventRoles, setEventRoles] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');

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
      const errorMessage = error.response?.data?.detail || error.message || t('errorLoadingEvents');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      toast.error(t('enterEventName'));
      return;
    }

    if (eventRoles.length === 0) {
      toast.error('Необходимо добавить хотя бы одну роль для мероприятия');
      return;
    }

    try {
      const newEvent = await eventsApi.create({
        name: eventName,
        description: eventDescription || undefined,
        roles: eventRoles.length > 0 ? eventRoles : [],
      });
      setShowCreateModal(false);
      setEventName('');
      setEventDescription('');
      setEventRoles([]);
      setNewRoleName('');
      // Перезагружаем список мероприятий с сервера
      await loadEvents();
      toast.success(t('eventCreated'));
    } catch (error: any) {
      console.error('Ошибка при создании мероприятия:', error);
      const errorMessage = error.response?.data?.detail || error.message || t('errorCreatingEvent');
      toast.error(errorMessage);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventName.trim()) {
      toast.error(t('enterEventName'));
      return;
    }

    try {
      const updated = await eventsApi.update(editingEvent.id, {
        name: eventName,
        description: eventDescription || undefined,
        roles: eventRoles.length > 0 ? eventRoles : [],
      });
      setEvents(events.map(e => e.id === editingEvent.id ? updated : e));
      setEditingEvent(null);
      setEventName('');
      setEventDescription('');
      setEventRoles([]);
      setNewRoleName('');
      setShowCreateModal(false);
      await loadEvents(); // Перезагружаем список мероприятий
      toast.success(t('eventUpdated'));
    } catch (error: any) {
      console.error('Ошибка при обновлении мероприятия:', error);
      const errorMessage = error.response?.data?.detail || error.message || t('errorUpdatingEvent');
      toast.error(errorMessage);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      await eventsApi.delete(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      toast.success(t('eventDeleted'));
    } catch (error: any) {
      toast.error(t('errorDeletingEvent'));
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventName(event.name);
    setEventDescription(event.description || '');
    setEventRoles(event.roles ? event.roles.map(r => r.name) : []);
    setShowCreateModal(true);
  };

  const handleOpenEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
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
    <>
    <div className="space-y-24 pb-24">
      {/* Заголовок и кнопка создания */}
      <section>
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-950 dark:text-white tracking-tight mb-4">
            {t('events')}
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed max-w-2xl">
            {t('eventsDescription')}
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => {
              setEditingEvent(null);
              setEventName('');
              setEventDescription('');
              setEventRoles([]);
              setShowCreateModal(true);
            }}
            className="flex items-center px-6 py-4 text-base font-light focus:outline-none transition-all"
            style={{
              backgroundColor: orgColor,
              color: '#fff',
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('createEvent')}
          </button>
        </div>
      </section>

      {/* Список мероприятий */}
      <section>
        {events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
              {t('noEvents')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-light mt-2">
              {t('createFirstEvent')}
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
                      title={t('edit')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title={t('delete')}
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
    </div>

    {/* Модальное окно создания/редактирования - вне основного контейнера для полного затемнения */}
    {showCreateModal && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          width: '100vw', 
          height: '100vh',
          margin: 0,
          padding: '1rem'
        }}
      >
        <div className="bg-white dark:bg-gray-900 w-full max-w-2xl border-2 border-gray-200 dark:border-gray-700 max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-light text-gray-950 dark:text-white">
                {editingEvent ? t('editEvent') : t('createEvent')}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEvent(null);
                  setEventName('');
                  setEventDescription('');
                  setEventRoles([]);
                  setNewRoleName('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t('eventName')} <span className="text-gray-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light"
                  placeholder={t('eventName')}
                  style={{ '--tw-focus-ring-color': orgColor } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t('eventDescription')}
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={4}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light resize-none"
                  placeholder={t('eventDescriptionPlaceholder')}
                  style={{ '--tw-focus-ring-color': orgColor } as React.CSSProperties}
                />
              </div>

              {/* Управление ролями */}
              <div>
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Роли мероприятия
                </label>
                <div className="space-y-3">
                  {/* Список существующих ролей */}
                  {eventRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {eventRoles.map((role, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-1.5 rounded-full text-sm font-light border-2"
                          style={{
                            borderColor: editingEvent?.roles?.[index]?.color || orgColor,
                            backgroundColor: editingEvent?.roles?.[index]?.color ? `${editingEvent.roles[index].color}20` : 'transparent',
                            color: editingEvent?.roles?.[index]?.color || orgColor,
                          }}
                        >
                          <span>{role}</span>
                          <button
                            onClick={() => {
                              setEventRoles(eventRoles.filter((_, i) => i !== index));
                            }}
                            className="ml-2 hover:opacity-70 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Добавление новой роли */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newRoleName.trim()) {
                          if (!eventRoles.includes(newRoleName.trim())) {
                            setEventRoles([...eventRoles, newRoleName.trim()]);
                            setNewRoleName('');
                          }
                        }
                      }}
                      className="flex-1 px-0 py-2 border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-base font-light"
                      placeholder="Введите название роли и нажмите Enter"
                      style={{ '--tw-focus-ring-color': orgColor } as React.CSSProperties}
                    />
                    <button
                      onClick={() => {
                        if (newRoleName.trim() && !eventRoles.includes(newRoleName.trim())) {
                          setEventRoles([...eventRoles, newRoleName.trim()]);
                          setNewRoleName('');
                        }
                      }}
                      className="px-4 py-2 border-2 text-sm font-light focus:outline-none transition-all flex items-center"
                      style={{
                        borderColor: orgColor,
                        color: orgColor,
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    setEventName('');
                    setEventDescription('');
                    setEventRoles([]);
                    setNewRoleName('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-base font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all"
                  style={{
                    borderColor: orgColor,
                    color: orgColor,
                  }}
                >
                  {t('cancel')}
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
                  {editingEvent ? t('save') : t('create')}
                </button>
              </div>
            </div>
          </div>
        </div>
    )}
    </>
  );
};

