import ffmpeg from 'fluent-ffmpeg';
import { AudioTrack } from './types';
import path from 'path';

export function listAudioTracks(inputPath: string): Promise<AudioTrack[]> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const audioStreams = metadata.streams
        .filter(s => s.codec_type === 'audio')
        .map((s, i) => ({
          index: i,
          codec: s.codec_name || 'unknown',
          language: s.tags?.language || 'unknown',
          channels: s.channels || 0,
        }));
      resolve(audioStreams);
    });
  });
}

export function removeAudioTracks(
  inputPath: string,
  tracksToKeep: number[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const inputExtension = path.extname(inputPath).toLowerCase().replace('.', '');
    
    const formatMap: Record<string, string> = {
      'mkv': 'matroska',
      'mp4': 'mp4',
      'avi': 'avi',
      'mov': 'mov',
      'webm': 'webm',
      'flv': 'flv',
      'wmv': 'wmv',
      'm4v': 'm4v',
      'mpg': 'mpeg',
      'mpeg': 'mpeg',
    };

    const outputFormat = formatMap[inputExtension] || 'mp4';

    const command = ffmpeg(inputPath);

    //map video
    command.outputOptions('-map', '0:v');

    //map selected audio tracks
    tracksToKeep.forEach(index => {
      command.outputOptions('-map', `0:a:${index}`);
    });

    //copy codecs (preserve quality)
    command.videoCodec('copy');
    command.audioCodec('copy');

    // force output format
    command.format(outputFormat);

    command
    .on('start', (cmd) => {
      console.log('FFmpeg command:', cmd);
    })
    .on('end', () => resolve())
    .on('error', (err) => reject(err))
    .save(outputPath);
  });
}