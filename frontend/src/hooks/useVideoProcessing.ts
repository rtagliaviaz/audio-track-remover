import { useState } from 'react';
import { videoApi } from '../services/api';
import type { VideoInfo } from '../types';

interface ProcessResult {
    success: boolean;
    outputPath?: string;
    error?: string;
}

export const useVideoProcessing = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processed, setProcessed] = useState(false);
    const [status, setStatus] = useState<string>('');

    const processSingle = async (
        videoInfo: VideoInfo,
        selectedTracks: number[],
        onJobStart: (jobId: string) => void,
        onComplete?: () => void,
        onError?: (error: string) => void
    ): Promise<ProcessResult> => {
        if (!videoInfo) {
            return { success: false, error: 'No video info' };
        }

        setLoading(true);
        setError(null);
        setProcessed(false);
        setStatus('Processing...');

        try {
            const outputFormat = videoInfo.name.split('.').pop() || 'mkv';
            const outputName = videoInfo.name.replace(/\.[^.]+$/, '');

            const response = await videoApi.processVideo({
                filename: videoInfo.name,
                tracksToKeep: selectedTracks, 
                outputName,
                outputFormat,
            });

            if (response.data.success) {
                onJobStart(response.data.jobId);
                setStatus('Processing...');
                if (onComplete) onComplete();
                return { success: true };
            } else {
                const msg = response.data.error || 'Failed to process video';
                setError(msg);
                setStatus('Failed');
                if (onComplete) onComplete();
                return { success: false, error: msg };
            }
        } catch (err) {
            const msg = 'Failed to process video';
            setError(msg);
            setStatus('Failed');
            console.error(err);
            if (onError) onError(msg);
            if (onComplete) onComplete();
            return { success: false, error: msg };
        } finally {
            // SSE maneja el loading
        }
    };

    const processBatch = async (
        videoList: string[],
        videoInfos: Map<string, VideoInfo>,
        selectedTracksMap: Map<string, number[]>,
        onProgress: (videoName: string, current: number, total: number, progress: number) => void,
        onComplete?: () => void,
        onError?: (videoName: string, error: string) => void
    ): Promise<{ processedCount: number; failedCount: number; total: number }> => {
        if (videoList.length === 0) {
            return { processedCount: 0, failedCount: 0, total: 0 };
        }

        setLoading(true);
        setError(null);
        setProcessed(false);
        setStatus(`Processing 0/${videoList.length}...`);

        let processedCount = 0;
        let failedCount = 0;
        const totalVideos = videoList.length;

        for (let i = 0; i < videoList.length; i++) {
            const videoName = videoList[i];
            const currentIndex = i + 1;

            try {
                const info = videoInfos.get(videoName);
                if (!info) {
                    failedCount++;
                    continue;
                }

                const hasSavedTracks = selectedTracksMap.has(videoName);
                const tracksToKeep = hasSavedTracks
                    ? selectedTracksMap.get(videoName)!
                    : info.tracks.map((t) => t.index);


                setStatus(`Processing ${videoName} (${currentIndex}/${totalVideos})`);

                const outputFormat = videoName.split('.').pop() || 'mkv';
                const outputName = videoName.replace(/\.[^.]+$/, '');

                const response = await videoApi.processVideo({
                    filename: videoName,
                    tracksToKeep,
                    outputName,
                    outputFormat,
                });

                if (!response.data.success) {
                  if (onError) onError(videoName, response.data.error || 'Failed to process video');
                  failedCount++;
                  continue;
                }

                const jobId = response.data.jobId;
                let jobCompleted = false;

                await new Promise<void>((resolve) => {
                    const eventSource = new EventSource(`/api/events?jobId=${jobId}`);
                    eventSource.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.progress !== undefined) {
                                const overallProgress = Math.round(
                                    ((currentIndex - 1) / totalVideos) * 100 + (data.progress / totalVideos)
                                );
                                onProgress(videoName, currentIndex, totalVideos, overallProgress);
                            }
                            if (data.done) {
                                jobCompleted = true;
                                processedCount++;
                                eventSource.close();
                                resolve();
                            }
                            if (data.error) {
                                jobCompleted = true;
                                failedCount++;
                                eventSource.close();
                                resolve();
                            }
                        } catch (err) {
                            console.error('SSE parse error:', err);
                        }
                    };
                    eventSource.onerror = () => {
                        if (!jobCompleted) {
                            processedCount++;
                        }
                        eventSource.close();
                        resolve();
                    };
                });
            } catch (err) {
                if (onError) onError(videoName, 'Failed to process video');
                failedCount++;
            }
        }

        const msg = `✅ Processed ${processedCount}/${totalVideos} videos (${failedCount} failed)`;
        setStatus(msg);
        setProcessed(true);
        setLoading(false);

        if (onComplete) onComplete();

        return { processedCount, failedCount, total: totalVideos };
    };

    const reset = () => {
        setLoading(false);
        setError(null);
        setProcessed(false);
        setStatus('');
    };

    return {
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
        reset,
    };
};