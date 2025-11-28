import apiClient from './client';

export interface EventRole {
  name: string;
  color: string;
}

export interface Event {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  description?: string;
  roles?: EventRole[];
}

export interface EventCreate {
  name: string;
  description?: string;
  roles?: string[];
}

export interface EventUpdate {
  name?: string;
  description?: string;
  roles?: string[];
}

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/events');
    return response.data;
  },

  getById: async (eventId: string): Promise<Event> => {
    const response = await apiClient.get<Event>(`/events/${eventId}`);
    return response.data;
  },

  create: async (eventData: EventCreate): Promise<Event> => {
    const response = await apiClient.post<Event>('/events', eventData);
    return response.data;
  },

  update: async (eventId: string, eventData: EventUpdate): Promise<Event> => {
    const response = await apiClient.put<Event>(`/events/${eventId}`, eventData);
    return response.data;
  },

  delete: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}`);
  },
};

