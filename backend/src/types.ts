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
    outputFormat: string;
}

export interface ProcessResponse {
    success: boolean;
    outputPath: string;
    message: string;
}

export interface QueueItem {
    id: string;
    filePath: string;
    tracksToKeep: number[];
    outputName: string;
    outputFormat: string;
    resolve: (value: { success: boolean; outputPath?: string; error?: string }) => void;
}