import React from 'react';
import { TrackList } from './TrackList';
import { ProgressBar } from './ProgressBar';
import { ProcessStatus } from './ProcessStatus';
import type { VideoInfo, AudioTrack } from '../types';

interface VideoProcessorProps {
    videoInfo: VideoInfo | null;
    tracks: AudioTrack[];
    selectedTracks: number[];
    selectedVideos: Set<string>;
    loading: boolean;
    processed: boolean;
    totalProgress: number;
    successMessage?: string;
    onToggleTrack: (index: number) => void;
    onProcess: () => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
  videoInfo,
  tracks,
  selectedTracks,
  selectedVideos,
  loading,
  processed,
  totalProgress,
  successMessage,
  onToggleTrack,
  onProcess,
}) => {
  if (!videoInfo) return null;

  console.log('successMEssage', successMessage)

  const buttonText = loading ? 'Processing...' :
    selectedVideos.size > 0 ? `Process ${selectedVideos.size} Selected Videos` :
      videoInfo ? 'Process Current Video' :
        'Select a video to process';

  return (
    <div className="card">
      <div className="file-info">
        <span className="name">📹 {videoInfo.name}</span>
        <span className="size">{(videoInfo.size / (1024 * 1024)).toFixed(2)} MB</span>
      </div>

      <TrackList
        tracks={tracks}
        selectedTracks={selectedTracks}
        onToggleTrack={onToggleTrack}
        isLoading={loading}
      />

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={onProcess}
          disabled={loading || (!videoInfo && selectedVideos.size === 0)}
          style={{ width: '100%' }}
        >
          {buttonText}
        </button>
      </div>

      <ProgressBar progress={totalProgress} isLoading={loading} />

      <ProcessStatus processed={processed} message={successMessage} />
    </div>
  );
};