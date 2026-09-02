import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listAudioTracks, removeAudioTracks, removeAudioTracksWithProgress } from '../../services/ffmpegService.js';
import ffmpeg from 'fluent-ffmpeg';

vi.mock('fluent-ffmpeg', () => {
    const mockCommand = {
        outputOptions: vi.fn().mockReturnThis(),
        videoCodec: vi.fn().mockReturnThis(),
        audioCodec: vi.fn().mockReturnThis(),
        format: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        save: vi.fn().mockReturnThis(),
    };

    const ffprobeFn = vi.fn();

    const ffmpegMock = vi.fn(() => mockCommand);
    (ffmpegMock as any).ffprobe = ffprobeFn;

    return {
        default: ffmpegMock,
    };
});

describe('ffmpegService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listAudioTracks', () => {
        it('should return audio tracks from a video file', async () => {
            const mockMetadata = {
                streams: [
                    { codec_type: 'video', codec_name: 'h264' },
                    { codec_type: 'audio', codec_name: 'aac', channels: 2, tags: { language: 'eng' } },
                    { codec_type: 'audio', codec_name: 'mp3', channels: 1, tags: { language: 'spa' } },
                ],
            };

            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.ffprobe.mockImplementation((path: string, callback: Function) => {
                callback(null, mockMetadata);
            });

            const result = await listAudioTracks('test.mp4');

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                index: 0,
                codec: 'aac',
                language: 'eng',
                channels: 2,
            });
            expect(result[1]).toEqual({
                index: 1,
                codec: 'mp3',
                language: 'spa',
                channels: 1,
            });
            expect(mockedFfmpeg.ffprobe).toHaveBeenCalledWith('test.mp4', expect.any(Function));
        });

        it('should return empty array if no audio tracks', async () => {
            const mockMetadata = {
                streams: [
                    { codec_type: 'video', codec_name: 'h264' },
                ],
            };

            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.ffprobe.mockImplementation((path: string, callback: Function) => {
                callback(null, mockMetadata);
            });

            const result = await listAudioTracks('test.mp4');

            expect(result).toHaveLength(0);
            expect(mockedFfmpeg.ffprobe).toHaveBeenCalled();
        });

        it('should reject on ffprobe error', async () => {
            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.ffprobe.mockImplementation((path: string, callback: Function) => {
                callback(new Error('FFprobe error'), null);
            });

            await expect(listAudioTracks('test.mp4')).rejects.toThrow('FFprobe error');
        });
    });

    describe('removeAudioTracks', () => {
        it('should process video with selected audio tracks', async () => {
            const mockCommand = {
                outputOptions: vi.fn().mockReturnThis(),
                videoCodec: vi.fn().mockReturnThis(),
                audioCodec: vi.fn().mockReturnThis(),
                format: vi.fn().mockReturnThis(),
                on: vi.fn().mockImplementation((event: string, callback: Function) => {
                    if (event === 'end') {
                        setTimeout(callback, 10);
                    }
                    return mockCommand;
                }),
                save: vi.fn(),
            };

            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.mockReturnValue(mockCommand);

            await removeAudioTracks('input.mp4', [0, 1], 'output.mp4');

            expect(mockedFfmpeg).toHaveBeenCalledWith('input.mp4');
            expect(mockCommand.outputOptions).toHaveBeenCalledWith('-map', '0:v');
            expect(mockCommand.outputOptions).toHaveBeenCalledWith('-map', '0:a:0');
            expect(mockCommand.outputOptions).toHaveBeenCalledWith('-map', '0:a:1');
            expect(mockCommand.format).toHaveBeenCalled();
            expect(mockCommand.save).toHaveBeenCalledWith('output.mp4');
        });

        it('should handle FFmpeg errors', async () => {
            const mockCommand = {
                outputOptions: vi.fn().mockReturnThis(),
                videoCodec: vi.fn().mockReturnThis(),
                audioCodec: vi.fn().mockReturnThis(),
                format: vi.fn().mockReturnThis(),
                on: vi.fn().mockImplementation((event: string, callback: Function) => {
                    if (event === 'error') {
                        setTimeout(() => callback(new Error('FFmpeg error')), 10);
                    }
                    return mockCommand;
                }),
                save: vi.fn(),
            };

            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.mockReturnValue(mockCommand);

            await expect(removeAudioTracks('input.mp4', [0], 'output.mp4')).rejects.toThrow('FFmpeg error');
        });
    });

    describe('removeAudioTracksWithProgress', () => {
        it('should process video and report progress', async () => {
            const progressCallback = vi.fn();

            const mockCommand = {
                outputOptions: vi.fn().mockReturnThis(),
                videoCodec: vi.fn().mockReturnThis(),
                audioCodec: vi.fn().mockReturnThis(),
                format: vi.fn().mockReturnThis(),
                on: vi.fn().mockImplementation((event: string, callback: Function) => {
                    if (event === 'progress') {
                        setTimeout(() => callback({ percent: 50 }), 10);
                    }
                    if (event === 'end') {
                        setTimeout(callback, 20);
                    }
                    return mockCommand;
                }),
                save: vi.fn(),
            };

            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.mockReturnValue(mockCommand);

            await removeAudioTracksWithProgress('input.mp4', [0], 'output.mp4', progressCallback);

            expect(progressCallback).toHaveBeenCalledWith(50);
            expect(progressCallback).toHaveBeenCalledWith(100);
            expect(mockCommand.save).toHaveBeenCalledWith('output.mp4');
        });

        it('should handle errors with progress', async () => {
            const progressCallback = vi.fn();

            const mockCommand = {
                outputOptions: vi.fn().mockReturnThis(),
                videoCodec: vi.fn().mockReturnThis(),
                audioCodec: vi.fn().mockReturnThis(),
                format: vi.fn().mockReturnThis(),
                on: vi.fn().mockImplementation((event: string, callback: Function) => {
                    if (event === 'error') {
                        setTimeout(() => callback(new Error('FFmpeg error')), 10);
                    }
                    return mockCommand;
                }),
                save: vi.fn(),
            };

            const mockedFfmpeg = vi.mocked(ffmpeg) as any;
            mockedFfmpeg.mockReturnValue(mockCommand);

            await expect(
                removeAudioTracksWithProgress('input.mp4', [0], 'output.mp4', progressCallback)
            ).rejects.toThrow('FFmpeg error');
            expect(progressCallback).not.toHaveBeenCalledWith(100);
        });
    });
});