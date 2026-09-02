import { useState, useEffect, useRef } from 'react';
import { videoApi } from '../services/api';
import type { VideoInfo } from '../types';

export const useVideos = () => {
  const [videos, setVideos] = useState<string[]>([]);
  const [videoInfos, setVideoInfos] = useState<Map<string, VideoInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFolder, setOutputFolder] = useState<string>('backend/outputs/');
  const isMounted = useRef(true);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await videoApi.getVideos();
      if (isMounted.current) {
        setVideos(response.data.videos);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to load videos');
      }
      console.error(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const loadVideoInfo = async (videoName: string): Promise<VideoInfo | null> => {
    try {
      const response = await videoApi.getVideoInfo(videoName);
      const data = response.data;
      const info: VideoInfo = {
        name: data.file.name,
        path: data.file.path,
        size: data.file.size,
        extension: data.file.extension,
        tracks: data.tracks,
      };
      setVideoInfos(prev => new Map(prev).set(videoName, info));
      return info;
    } catch (err) {
      console.error('Failed to load video info:', err);
      return null;
    }
  };


  const loadOutputFolder = async () => {
        try {
            const response = await videoApi.getOutputFolder();
            setOutputFolder(response.data.outputFolder);
        } catch (err) {
            console.error('Failed to load output folder:', err);
            setOutputFolder('backend/outputs/');
        }
    };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await loadVideos();
      await loadOutputFolder();
    };

    init();

    return () => {
      mounted = false;
    };
     
  }, []);

  return { videos, videoInfos, loading, error, loadVideos, loadVideoInfo, outputFolder, loadOutputFolder };
};