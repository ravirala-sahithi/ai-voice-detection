import api from './api';

export const voiceService = {
  async analyzeAudio(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/voice/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  async getResult(id) {
    const response = await api.get(`/api/voice/result/${id}`);
    return response.data;
  },

  async getHistory() {
    const response = await api.get('/api/voice/history');
    return response.data;
  },

  async deleteResult(id) {
    const response = await api.delete(`/api/voice/history/${id}`);
    return response.data;
  },

  async getDashboardStats() {
    const response = await api.get('/api/voice/dashboard');
    return response.data;
  },
};
