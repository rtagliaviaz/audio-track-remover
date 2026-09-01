import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { listAudioTracks, removeAudioTracksWithProgress } from './services/ffmpegService';
import { ProcessRequest, UploadResponse, QueueItem } from './types';
import { config, ensureDirectories } from './config';

const router = express.Router();

ensureDirectories();

const FOLDER_PATH = config.videoFolder;
const OUTPUT_PATH = config.outputFolder;

class ProcessingQueue extends EventEmitter {
    private queue: QueueItem[] = [];
    private isProcessing = false;
    private currentProgress: number = 0;
    private currentJobId: string | null = null;

    add(item: Omit<QueueItem, 'resolve'>): Promise<{ success: boolean; outputPath?: string; error?: string }> {
        return new Promise((resolve) => {
            const queueItem: QueueItem = {
                ...item,
                resolve,
            };
            this.queue.push(queueItem);
            this.emit('item-added', queueItem);
            this.processNext();
        });
    }

    private async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const item = this.queue.shift()!;
        this.currentProgress = 0;
        this.currentJobId = item.id;

        this.emit('job-start', item);

        try {
            const outputPath = path.join(OUTPUT_PATH, `${item.outputName}.${item.outputFormat}`);

            await removeAudioTracksWithProgress(
                item.filePath,
                item.tracksToKeep,
                outputPath,
                (percent) => {
                    this.currentProgress = percent;
                    this.emit('job-progress', item, percent);
                }
            );


            this.currentProgress = 100;
            this.emit('job-complete', item, outputPath);
            item.resolve({ success: true, outputPath });
        } catch (error) {
            console.error('Process error:', error);
            this.emit('job-error', item, error);
            item.resolve({ success: false, error: String(error) });
        } finally {
            this.isProcessing = false;
            this.currentProgress = 0;
            this.currentJobId = null;
            this.processNext();
        }
    }

    getStatus(): { queueLength: number; isProcessing: boolean; currentProgress: number; currentJobId: string | null } {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            currentProgress: this.currentProgress,
            currentJobId: this.currentJobId,
        };
    }
}

const processingQueue = new ProcessingQueue();

processingQueue.on('item-added', (item) => {
    console.log(`Job added to queue: ${item.id}`);
});

processingQueue.on('job-start', (item) => {
    console.log(`Processing job: ${item.id}`);
});

processingQueue.on('job-progress', (item, percent) => {
    console.log(`Job ${item.id}: ${percent}%`);
});

processingQueue.on('job-complete', (item, outputPath) => {
    console.log(`Job completed: ${item.id} -> ${outputPath}`);
});

processingQueue.on('job-error', (item, error) => {
    console.error(`Job failed: ${item.id}`, error);
});

router.get('/videos', (req, res) => {
    try {
        const files = fs.readdirSync(FOLDER_PATH);
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg'];
        const videos = files.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return videoExtensions.includes(ext);
        });

        res.json({ videos, folderPath: FOLDER_PATH });
    } catch (error) {
        console.error('List videos error:', error);
        res.status(500).json({ error: 'Failed to list videos' });
    }
});

router.get('/queue/status', (req, res) => {
    res.json(processingQueue.getStatus());
});

router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const jobId = req.query.jobId as string;

    if (!jobId) {
        res.write(`data: ${JSON.stringify({ error: 'jobId is required' })}\n\n`);
        res.end();
        return;
    }

    const status = processingQueue.getStatus();
    if (status.currentJobId === jobId) {
        res.write(`data: ${JSON.stringify({ progress: status.currentProgress, jobId })}\n\n`);
    }

    const onProgress = (item: QueueItem, percent: number) => {
        if (item.id === jobId) {
            res.write(`data: ${JSON.stringify({ progress: percent, jobId })}\n\n`);
        }
    };

    const onComplete = (item: QueueItem, outputPath: string) => {
        if (item.id === jobId) {
            res.write(`data: ${JSON.stringify({ progress: 100, jobId, done: true, outputPath })}\n\n`);
            res.end();
        }
    };

    const onError = (item: QueueItem, error: Error) => {
        if (item.id === jobId) {
            res.write(`data: ${JSON.stringify({ progress: 0, jobId, error: error.message })}\n\n`);
            res.end();
        }
    };

    processingQueue.on('job-progress', onProgress);
    processingQueue.on('job-complete', onComplete);
    processingQueue.on('job-error', onError);

    req.on('close', () => {
        processingQueue.off('job-progress', onProgress);
        processingQueue.off('job-complete', onComplete);
        processingQueue.off('job-error', onError);
        res.end();
    });
});

router.post('/video-info', async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({ error: 'filename is required' });
        }

        const filePath = path.join(FOLDER_PATH, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const extension = filename.split('.').pop() || 'mkv';
        const tracks = await listAudioTracks(filePath);

        const response: UploadResponse = {
            file: {
                path: filePath,
                name: filename,
                size: fs.statSync(filePath).size,
                extension,
            },
            tracks,
        };

        res.json(response);
    } catch (error) {
        console.error('Get video info error:', error);
        res.status(500).json({ error: 'Failed to get video info' });
    }
});

router.post('/process', async (req, res) => {
    try {
        const { tracksToKeep, outputName, outputFormat, filename } = req.body;

        if (!filename) {
            return res.status(400).json({ error: 'filename is required' });
        }

        const filePath = path.join(FOLDER_PATH, filename);

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
        }).then((result: { success: boolean; outputPath?: string; error?: string }) => {
            if (result.success) {
                console.log(`Job ${jobId} completado: ${result.outputPath}`);
            } else {
                console.error(`Job ${jobId} falló: ${result.error}`);
            }
        });

    } catch (error) {
        console.error('Process error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to start processing' });
        }
    }
});


router.get('/download/:filename', (req, res) => {
    const filePath = path.join(OUTPUT_PATH, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

export default router;