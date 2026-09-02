import React, { useState } from 'react';
import { VideoList } from './VideoList';
import { StatusBar } from './StatusBar';
import { VideoProcessor } from './VideoProcessor';
import { Header } from './Header';
import { ErrorLog } from './ErrorLog';
import { useVideos } from '../hooks/useVideos';
import { useSSE } from '../hooks/useSSE';
import { useTrackSelection } from '../hooks/useTrackSelection';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import type { VideoInfo, AudioTrack } from '../types';

interface ErrorEntry {
    videoName: string;
    error: string;
    timestamp: Date;
}

export const Home: React.FC = () => {
    const { videos, videoInfos, loadVideos, loadVideoInfo, outputFolder } = useVideos();
    const {
        selectedVideo,
        selectedTracks,
        selectedTracksMap,
        toggleTrack,
        setTracksForVideo,
    } = useTrackSelection();

    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processProgress, setProcessProgress] = useState(0);
    const [queueStatus, setQueueStatus] = useState<string>('');
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [selectedVideoInfo, setSelectedVideoInfo] = useState<VideoInfo | null>(null);
    const [tracks, setTracks] = useState<AudioTrack[]>([]);
    const [errors, setErrors] = useState<ErrorEntry[]>([]);

    const { progress: sseProgress, isComplete } = useSSE(currentJobId);
    const {
        loading,
        error,
        processed,
        status,
        processSingle,
        processBatch,
        setError,
        setStatus,
        setProcessed,
        setLoading,
    } = useVideoProcessing();

    // Sincronizar progreso SSE
    if (sseProgress > 0 && sseProgress !== processProgress) {
        setProcessProgress(sseProgress);
    }

    if (isComplete && currentJobId) {
        setProcessProgress(100);
        setStatus('Done');
        setProcessed(true);
        setQueueStatus('');
        setCurrentJobId(null);
        setLoading(false);
    }

    const addError = (videoName: string, error: string) => {
        setErrors(prev => [...prev, { videoName, error, timestamp: new Date() }]);
    };

    const handleSelectVideo = async (videoName: string) => {
        setError(null);
        setProcessed(false);
        setLoading(true);

        try {
            const cached = videoInfos.get(videoName);
            if (cached) {
                setSelectedVideoInfo(cached);
                setTracks(cached.tracks);
                const savedTracks = selectedTracksMap.get(videoName) || cached.tracks.map((t: AudioTrack) => t.index);
                setTracksForVideo(videoName, savedTracks);
                setStatus(`Selected: ${videoName}`);
                setLoading(false);
                return;
            }

            const info = await loadVideoInfo(videoName);
            if (info) {
                setSelectedVideoInfo(info);
                setTracks(info.tracks);
                const allTracks = info.tracks.map((t: AudioTrack) => t.index);
                setTracksForVideo(videoName, allTracks);
                setStatus(`Selected: ${videoName}`);
            } else {
                const errMsg = 'Failed to load video info';
                setError(errMsg);
                setStatus(`Selected: ${videoName} (no track info available)`);
                addError(videoName, errMsg);
            }
        } catch (err) {
            const errMsg = 'Failed to load video info';
            console.error(err);
            setError(errMsg);
            addError(videoName, errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        if (selectedVideos.size > 0) {
            const videoList = Array.from(selectedVideos);
            if (!window.confirm(`Process ${videoList.length} selected videos?`)) return;

            setErrors([]);

            await processBatch(
                videoList,
                videoInfos,
                selectedTracksMap,
                (videoName, current, total, progress) => {
                    setProcessProgress(progress);
                    setUploadProgress(progress);
                    setStatus(`Processing ${videoName} (${current}/${total})`);
                },
                () => {
                    setUploadProgress(100);
                    setProcessProgress(100);
                    loadVideos();
                },
                (videoName, errorMsg) => {
                    addError(videoName, errorMsg);
                }
            );
            return;
        }

        if (selectedVideoInfo && selectedVideo) {
            setErrors([]);

            await processSingle(
                selectedVideoInfo,
                selectedTracks,
                (jobId) => {
                    setCurrentJobId(jobId);
                    setQueueStatus('Processing...');
                },
                () => {},
                (errorMsg) => {
                    addError(selectedVideo, errorMsg);
                }
            );
            return;
        }

        setError('Please select a video or select videos from the list');
    };

    const totalProgress = uploadProgress > 0 && uploadProgress < 100 ? uploadProgress : processProgress;

    const successMessage = processed
        ? `✅ Video processed successfully. File saved in: ${outputFolder}`
        : '';

    return (
        <div className="container">
            <Header />

            <StatusBar status={status} queueStatus={queueStatus} error={error} />

            <ErrorLog errors={errors} onClear={() => setErrors([])} />

            <VideoList
                videos={videos}
                selectedVideo={selectedVideo}
                selectedVideos={selectedVideos}
                onSelectVideo={handleSelectVideo}
                onToggleSelection={(video) => {
                    const newSet = new Set(selectedVideos);
                    if (newSet.has(video)) newSet.delete(video);
                    else newSet.add(video);
                    setSelectedVideos(newSet);
                }}
                onSelectAll={() => setSelectedVideos(new Set(videos))}
                onDeselectAll={() => setSelectedVideos(new Set())}
            />

            <VideoProcessor
                videoInfo={selectedVideoInfo}
                tracks={tracks}
                selectedTracks={selectedTracks}
                selectedVideos={selectedVideos}
                loading={loading}
                processed={processed}
                totalProgress={totalProgress}
                onToggleTrack={(index) => selectedVideo && toggleTrack(selectedVideo, index)}
                onProcess={handleProcess}
                successMessage={successMessage}
            />
        </div>
    );
};