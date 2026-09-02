import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processingQueue } from '../../services/queueService.js';
import { removeAudioTracksWithProgress } from '../../services/ffmpegService.js';

vi.mock('../../services/ffmpegService.js', () => ({
    removeAudioTracksWithProgress: vi.fn().mockImplementation(
        (inputPath, tracksToKeep, outputPath, onProgress) => {
            // progress simulation
            onProgress(50);
            // successful 
            return Promise.resolve();
        }
    ),
}));

describe('ProcessingQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add a job to the queue', async () => {
        const mockRemove = vi.mocked(removeAudioTracksWithProgress);
        mockRemove.mockImplementation((inputPath, tracksToKeep, outputPath, onProgress) => {
            onProgress(100);
            return Promise.resolve();
        });

        const result = await processingQueue.add({
            id: 'job_123',
            filePath: '/test/video.mp4',
            tracksToKeep: [0],
            outputName: 'output',
            outputFormat: 'mp4',
        });

        expect(result).toEqual({ success: true, outputPath: expect.stringContaining('output.mp4') });
    });

    it('should handle processing errors', async () => {
        const mockError = new Error('FFmpeg failed');
        const mockRemove = vi.mocked(removeAudioTracksWithProgress);
        mockRemove.mockRejectedValue(mockError);

        const result = await processingQueue.add({
            id: 'job_456',
            filePath: '/test/video.mp4',
            tracksToKeep: [0],
            outputName: 'output',
            outputFormat: 'mp4',
        });

        expect(result).toEqual({ success: false, error: 'Error: FFmpeg failed' });
    });

    it('should return queue status', () => {
        const status = processingQueue.getStatus();
        expect(status).toHaveProperty('queueLength');
        expect(status).toHaveProperty('isProcessing');
        expect(status).toHaveProperty('currentProgress');
        expect(status).toHaveProperty('currentJobId');
    });
});