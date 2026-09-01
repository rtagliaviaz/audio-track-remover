import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { listAudioTracks } from '../services/ffmpegService';
import { processingQueue } from '../services/queueService';

export const videoController = {
    // GET /api/videos
    listVideos: (req: Request, res: Response) => {
        try {
            const files = fs.readdirSync(config.videoFolder);
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg'];
            const videos = files.filter(f => {
                const ext = path.extname(f).toLowerCase();
                return videoExtensions.includes(ext);
            });

            res.json({ videos, folderPath: config.videoFolder });
        } catch (error) {
            console.error('List videos error:', error);
            res.status(500).json({ error: 'Failed to list videos' });
        }
    },

    // POST /api/video-info
    getVideoInfo: async (req: Request, res: Response) => {
        try {
            const { filename } = req.body;

            if (!filename) {
                return res.status(400).json({ error: 'filename is required' });
            }

            const filePath = path.join(config.videoFolder, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Video not found' });
            }

            const extension = filename.split('.').pop() || 'mkv';
            const tracks = await listAudioTracks(filePath);

            res.json({
                file: {
                    path: filePath,
                    name: filename,
                    size: fs.statSync(filePath).size,
                    extension,
                },
                tracks,
            });
        } catch (error) {
            console.error('Get video info error:', error);
            res.status(500).json({ error: 'Failed to get video info' });
        }
    },

    // POST /api/process
    processVideo: async (req: Request, res: Response) => {
        try {
            const { tracksToKeep, outputName, outputFormat, filename } = req.body;

            if (!filename) {
                return res.status(400).json({ error: 'filename is required' });
            }

            const filePath = path.join(config.videoFolder, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            if (tracksToKeep === undefined || tracksToKeep === null) {
                return res.status(400).json({ error: 'tracksToKeep is required' });
            }

            const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

            res.json({
                success: true,
                jobId,
                message: 'Video processing started',
            });

            processingQueue.add({
                id: jobId,
                filePath,
                tracksToKeep,
                outputName,
                outputFormat,
            }).catch((error) => {
                console.error(`Job ${jobId} failed:`, error);
            });

        } catch (error) {
            console.error('Process error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to start processing' });
            }
        }
    },
};