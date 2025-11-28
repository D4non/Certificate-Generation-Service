import apiClient from './client';

export interface Participant {
  fio: string;
  email: string;
  role: 'участник' | 'докладчик' | 'победитель' | 'призер';
  place?: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: 'svg' | 'html';
  file_url?: string;
  preview_url?: string;
}

export interface CertificateGenerationRequest {
  template_id: string;
  participants: Participant[];
  event_name: string;
  issue_date?: string;
  send_email?: boolean;
  email_subject?: string;
  email_body?: string;
}

export interface CertificateGenerationResponse {
  certificate_ids: string[];
  zip_url?: string;
  message: string;
}

export const certificatesApi = {
  uploadTemplate: async (file: File, name: string, type: 'svg' | 'html'): Promise<CertificateTemplate> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('type', type);
    
    const response = await apiClient.post<CertificateTemplate>('/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTemplates: async (): Promise<CertificateTemplate[]> => {
    const response = await apiClient.get<CertificateTemplate[]>('/templates');
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/templates/${id}`);
  },

  updateTemplate: async (id: string, content: string): Promise<CertificateTemplate> => {
    const response = await apiClient.put<CertificateTemplate>(`/templates/${id}`, {
      content,
    });
    return response.data;
  },

  parseParticipantsFile: async (file: File): Promise<Participant[]> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<Participant[]>('/participants/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateCertificates: async (request: CertificateGenerationRequest): Promise<CertificateGenerationResponse> => {
    const response = await apiClient.post<CertificateGenerationResponse>('/certificates/generate', request);
    return response.data;
  },

  downloadCertificate: async (certificateId: string): Promise<Blob> => {
    const response = await apiClient.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

