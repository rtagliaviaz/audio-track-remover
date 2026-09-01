import React from 'react';

interface VideoListProps {
    videos: string[];
    selectedVideo: string | null;
    selectedVideos: Set<string>;
    onSelectVideo: (videoName: string) => void;
    onToggleSelection: (videoName: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export const VideoList: React.FC<VideoListProps> = ({
    videos,
    selectedVideo,
    selectedVideos,
    onSelectVideo,
    onToggleSelection,
    onSelectAll,
    onDeselectAll,
}) => {
    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Videos</h3>
                <div>
                    <button
                        className="btn btn-secondary"
                        onClick={onSelectAll}
                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                    >
                        Select All
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onDeselectAll}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            <div className="video-list">
                {videos.map(video => {
                    const isSelected = selectedVideos.has(video);
                    const isActive = selectedVideo === video;

                    return (
                        <div
                            key={video}
                            className={`video-item ${isActive ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                background: isActive ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                                borderLeft: isActive ? '3px solid #4CAF50' : '3px solid transparent',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                    onToggleSelection(video);
                                    onSelectVideo(video);
                                }}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    accentColor: '#4CAF50',
                                }}
                            />

                            <span
                                style={{
                                    flex: 1,
                                    cursor: 'pointer',
                                    padding: '0.25rem 0',
                                }}
                                onClick={() => onSelectVideo(video)}
                            >
                                📹 {video}
                            </span>
                        </div>
                    );
                })}
            </div>

            {selectedVideos.size > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <span style={{ color: '#4CAF50' }}>
                        ✅ {selectedVideos.size} video(s) selected
                    </span>
                </div>
            )}
        </div>
    );
};