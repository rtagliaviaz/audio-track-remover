import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const videoApi = {
  getVideos: () => api.get('/videos'),
  getVideoInfo: (filename: string) => api.post('/video-info', { filename }),
  processVideo: (data: { filename: string; tracksToKeep: number[]; outputName: string; outputFormat: string }) =>
    api.post('/process', data),
  getOutputFolder: () => api.get('/output-folder'),
};