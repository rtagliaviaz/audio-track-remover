import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { videoController } from '../../controllers/videoController';
import { config } from '../../config';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('../../config', () => ({
    config: {
        videoFolder: '/mock/videos',
        outputFolder: '/mock/outputs',
    },
}));

vi.mock('../../services/ffmpegService', () => ({
    listAudioTracks: vi.fn().mockResolvedValue([
        { index: 0, codec: 'aac', language: 'eng', channels: 2 },
    ]),
}));

vi.mock('../../services/queueService', () => ({
    processingQueue: {
        add: vi.fn().mockResolvedValue({ success: true }),
    },
}));

describe('videoController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        req = { body: {}, params: {} };
        res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis(),
        };
    });

    describe('listVideos', () => {
        it('should return list of videos', () => {
            const mockFiles = ['video1.mp4', 'video2.mkv', 'file.txt'];
            vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);

            videoController.listVideos(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({
                videos: ['video1.mp4', 'video2.mkv'],
                folderPath: '/mock/videos',
            });
        });

        it('should handle errors', () => {
            vi.mocked(fs.readdirSync).mockImplementation(() => {
                throw new Error('Permission denied');
            });

            videoController.listVideos(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Failed to list videos',
            });
        });
    });

    describe('getVideoInfo', () => {
        it('should return video info with tracks', async () => {
            req.body = { filename: 'video.mp4' };
            const mockStats = { size: 1024 };
            const mockTracks = [{ index: 0, codec: 'aac', language: 'eng', channels: 2 }];

            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.statSync).mockReturnValue(mockStats as any);

            const { listAudioTracks } = await import('../../services/ffmpegService.js');
            vi.mocked(listAudioTracks).mockResolvedValue(mockTracks);

            await videoController.getVideoInfo(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({
                file: {
                    path: expect.stringContaining('video.mp4'),
                    name: 'video.mp4',
                    size: 1024,
                    extension: 'mp4',
                },
                tracks: mockTracks,
            });
        });

        it('should return 404 if video not found', async () => {
            req.body = { filename: 'nonexistent.mp4' };
            vi.mocked(fs.existsSync).mockReturnValue(false);

            await videoController.getVideoInfo(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Video not found',
            });
        });

        it('should return 400 if filename is missing', async () => {
            req.body = {};

            await videoController.getVideoInfo(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'filename is required',
            });
        });
    });

    describe('processVideo', () => {
        it('should start processing a video', async () => {
            req.body = {
                filename: 'video.mp4',
                tracksToKeep: [0],
                outputName: 'output',
                outputFormat: 'mp4',
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            const { processingQueue } = await import('../../services/queueService.js');
            vi.mocked(processingQueue.add).mockResolvedValue({ success: true });

            await videoController.processVideo(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                jobId: expect.stringContaining('job_'),
                message: 'Video processing started',
            });
        });

        it('should return 400 if filename is missing', async () => {
            req.body = { tracksToKeep: [0] };

            await videoController.processVideo(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'filename is required',
            });
        });

        it('should return 404 if file not found', async () => {
            req.body = {
                filename: 'nonexistent.mp4',
                tracksToKeep: [0],
            };
            vi.mocked(fs.existsSync).mockReturnValue(false);

            await videoController.processVideo(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'File not found',
            });
        });
    });
});