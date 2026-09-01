import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { removeAudioTracksWithProgress } from './ffmpegService';
import { QueueItem } from '../types';
import { config } from '../config';

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
            const outputPath = path.join(config.outputFolder, `${item.outputName}.${item.outputFormat}`);

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

    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            currentProgress: this.currentProgress,
            currentJobId: this.currentJobId,
        };
    }
}

export const processingQueue = new ProcessingQueue();

// Logs
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