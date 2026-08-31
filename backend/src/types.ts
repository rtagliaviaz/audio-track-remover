export interface AudioTrack {
  index: number;
  codec: string;
  language: string;
  channels: number;
}

export interface UploadResponse {
  file: {
    path: string;
    name: string;
    size: number;
    extension: string; 
  };
  tracks: AudioTrack[];
}

export interface ProcessRequest {
  filePath: string;
  tracksToKeep: number[];
  outputFormat?: string; 
}

export interface ProcessResponse {
  success: boolean;
  outputPath: string;
  message: string;
}