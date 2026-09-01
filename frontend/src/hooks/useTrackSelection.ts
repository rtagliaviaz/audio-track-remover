import { useState } from 'react';

export const useTrackSelection = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [selectedTracksMap, setSelectedTracksMap] = useState<Map<string, number[]>>(new Map());

  const toggleTrack = (videoName: string, index: number) => {
    if (!videoName) return;

    const currentTracks = selectedTracksMap.get(videoName) || [];
    const newSelected = currentTracks.includes(index)
      ? currentTracks.filter(i => i !== index)
      : [...currentTracks, index];

    setSelectedTracks(newSelected);
    setSelectedTracksMap(prev => {
      const newMap = new Map(prev);
      newMap.set(videoName, newSelected);
      return newMap;
    });
  };

  const setTracksForVideo = (videoName: string, tracks: number[]) => {
    setSelectedVideo(videoName);
    setSelectedTracks(tracks);
    setSelectedTracksMap(prev => {
      const newMap = new Map(prev);
      newMap.set(videoName, tracks);
      return newMap;
    });
  };

  const getTracksForVideo = (videoName: string): number[] => {
    return selectedTracksMap.get(videoName) || [];
  };

  return {
    selectedVideo,
    selectedTracks,
    selectedTracksMap,
    toggleTrack,
    setTracksForVideo,
    getTracksForVideo,
  };
};