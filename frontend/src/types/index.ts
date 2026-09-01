export interface AudioTrack {
  index: number;
  codec: string;
  language: string;
  channels: number;
}

export interface VideoInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  tracks: AudioTrack[];
}