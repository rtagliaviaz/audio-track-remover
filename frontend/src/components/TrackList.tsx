import React from 'react';

interface AudioTrack {
  index: number;
  codec: string;
  language: string;
  channels: number;
}

interface TrackListProps {
  tracks: AudioTrack[];
  selectedTracks: number[];
  onToggleTrack: (index: number) => void;
  isLoading: boolean;
}

export function TrackList({ tracks, selectedTracks, onToggleTrack, isLoading }: TrackListProps) {
  if (tracks.length === 0) {
    return <p style={{ color: '#666' }}>No audio tracks found</p>;
  }

  return (
    <div className="track-list">
      {tracks.map(track => (
        <div key={track.index} className="track-item">
          <input
            type="checkbox"
            checked={selectedTracks.includes(track.index)}
            onChange={() => onToggleTrack(track.index)}
            disabled={isLoading}
          />
          <div className="track-info">
            <span className="name">
              Track {track.index}
              {track.language && track.language !== 'unknown' && ` (${track.language})`}
            </span>
            <span className="details">
              {track.codec} • {track.channels} channels
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}