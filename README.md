# Audio Track Remover
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)

Local web-based tool to remove unwanted audio tracks from video files using FFmpeg. Built with React, Node.js, and TypeScript.

English | [Spanish](./README.es.md)

## Index
- [Demo](#demo)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Backend](#backend)
- [Frontend](#frontend)
- [License](#license)

## Demo

[![Video Demo](https://img.youtube.com/vi/vQuJTb5Qt9A/0.jpg)](https://www.youtube.com/watch?v=vQuJTb5Qt9A)


[![Watch on YouTube](https://img.shields.io/badge/Watch%20on-YouTube-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/vQuJTb5Qt9A)

## Usage

1. Place your videos in the configured `VIDEO_FOLDER_PATH` (default: `backend/videos/`)
2. Open the frontend in your browser (default: `http://localhost:5173`)
3. The video list will automatically load
4. Click a video to view its audio tracks
5. Select/deselect tracks to keep (or unselect all for mute)
6. Check the checkbox on videos to select them for batch processing
7. Click the **Process** button
8. Watch the real-time progress bar update via SSE
9. Processed videos are saved in `OUTPUT_FOLDER_PATH` (default: `backend/outputs/`)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Video Processing | FFmpeg (fluent-ffmpeg) |
| Real-time Updates | Server-Sent Events (SSE) |
| Queue | In-memory processing queue |
| Testing | Vitest |

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    AUDIO TRACK REMOVER                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + TypeScript)                              │
│  ├── Select multiple videos                                 │
│  ├── Choose audio tracks per video                          │
│  └── Real-time progress via SSE                             │
│                         │                                   │
│                         ▼                                   │
│  Backend (Node.js + Express)                                │
│  ├── /api/videos        → List videos                       │
│  ├── /api/video-info    → Get audio tracks                  │
│  ├── /api/process       → Add to processing queue           │
│  └── /api/events        → SSE progress updates              │
│                         │                                   │
│                         ▼                                   │
│  Processing Queue (in-memory)                               │
│  └── FFmpeg removes selected audio tracks                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Features

- Select multiple videos at once
- View and select which audio tracks to keep (or remove all)
- Batch processing with real-time progress (SSE)
- Per-video track selection persistence
- Error log to track which videos failed and why
- Fully configurable via `.env` (video folder, output folder)
- 100% local – no cloud dependencies, no uploads

## Quick Start
### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [FFmpeg](https://ffmpeg.org/download.html) installed and available in your system's PATH

### Installation
```bash
# Clone the repository
git clone https://github.com/rtagliaviaz/audio-track-remover.git
cd audio-track-remover

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration
Create a `.env` file in the `backend/` directory:
```env
# Video folder (where your videos are stored)
VIDEO_FOLDER_PATH=./videos

# Output folder (where processed videos will be saved)
OUTPUT_FOLDER_PATH=./outputs

# Server port (default: 3001)
PORT=3001
```

### Run the App
```bash
# Terminal 1: Start the backend
cd backend
npm run dev

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

## Backend

### Structure
```
backend/src/
├── __tests__/
│   ├── controllers/
│   └── services/
├── controllers/
│   ├── videoController.ts
│   └── queueController.ts
├── services/
│   ├── ffmpegService.ts
│   └── queueService.ts
├── routes/
│   └── index.ts
├── config.ts
└── index.ts
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VIDEO_FOLDER_PATH` | Path to the folder containing videos | `./videos` |
| `OUTPUT_FOLDER_PATH` | Path to the folder where processed videos will be saved | `./outputs` |
| `PORT` | Port for the Express server | `3001` |


### API Endpoints

#### `GET /api/videos`

List all videos in the configured folder.

- **Endpoint**: `/api/videos`
- **Method**: `GET`
- **Status Codes**:
  - `200 OK`: Videos retrieved successfully.
  - `500 Internal Server Error`: Failed to list videos.
- **Response**:
```json
{
  "videos": ["video1.mp4", "video2.mkv", "video3.avi"],
  "folderPath": "/path/to/videos"
}
```

#### `POST /api/video-info`
Get audio tracks information for a specific video.

- **Endpoint**: `/api/video-info`
- **Method**: `POST`
- **Request Body**:
```json
{
  "filename": "video.mp4"
}
```
- **Status Codes**:
  - `200 OK`: Video info retrieved successfully.
  - `400 Bad Request`: filename is required.
  - `404 Not Found`: Video not found.
  - `500 Internal Server Error`: Failed to get video info.
- **Response**:
```json
{
  "file": {
    "path": "/path/to/video.mp4",
    "name": "video.mp4",
    "size": 1024000,
    "extension": "mp4"
  },
  "tracks": [
    {
      "index": 0,
      "codec": "aac",
      "language": "eng",
      "channels": 2
    },
    {
      "index": 1,
      "codec": "mp3",
      "language": "spa",
      "channels": 1
    }
  ]
}
```

#### `POST /api/process`
Add a video to the processing queue.

- **Endpoint**: `/api/process`
- **Method**: `POST`
- **Request Body**:
```json
{
  "filename": "video.mp4",
  "tracksToKeep": [0],
  "outputName": "output",
  "outputFormat": "mp4"
}
```
- **Status Codes**:
  - `200 OK`: Video processing started.
  - `400 Bad Request`: filename or tracksToKeep is missing.
  - `404 Not Found`: File not found.
  - `500 Internal Server Error`: Failed to start processing.
- **Response**:
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "message": "Video processing started"
}
```

#### `GET /api/events`

Server-Sent Events endpoint for real-time progress updates.

- **Endpoint**: `/api/events?jobId={jobId}`
- **Method**: `GET`
- **Example**: `/api/events?jobId=job_1234567890_abc123`
- **Status Codes**:
  - `200 OK`: Queue status retrieved successfully.
- **Response**: Server-Sent Events stream with progress updates.
- **Event Data**: 
```json
{
  "progress": 50,
  "jobId": "job_1234567890_abc123"
}
```
- **Completion Event**: 
```json
{
  "progress": 100,
  "jobId": "job_1234567890_abc123",
  "done": true,
  "outputPath": "/path/to/output.mp4"
}
```

#### `GET /api/queue/status`

Get the current status of the processing queue.

- **Endpoint**: `/api/queue/status`
- **Method**: `GET`
- **Status Codes**:
  - `200 OK`: Queue status retrieved successfully.
- **Response**:
```json
{
  "queueLength": 2,
  "isProcessing": true,
  "currentProgress": 45,
  "currentJobId": "job_1234567890_abc123"
}
```

#### `GET /api/output-folder`

Get the configured output folder path.

- **Endpoint**: `/api/output-folder`
- **Method**: `GET`
- **Status Codes**:
  - `200 OK`: Output folder retrieved successfully.
  - `500 Internal Server Error`: Failed to get output folder.
- **Response**:
```json
{
  "outputFolder": "D:/outputs"
}
```

### Tests
```bash
cd backend
npm test
```

## Frontend

### Structure
```
frontend/src/
├── components/
│   ├── Header.tsx
│   ├── VideoList.tsx
│   ├── TrackList.tsx
│   ├── VideoProcessor.tsx
│   ├── StatusBar.tsx
│   ├── ProgressBar.tsx
│   └── ErrorLog.tsx
├── hooks/
│   ├── useVideos.ts
│   ├── useTrackSelection.ts
│   ├── useVideoProcessing.ts
│   └── useSSE.ts
├── services/
│   └── api.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

### Components

| Component | Description |
|----------|-------------|
| `VideoList` | List of videos available for processing |
| `TrackList` | List of audio tracks for each video |
| `VideoProcessor` | Component for selecting and processing videos |
| `StatusBar` | Display of current processing status |
| `ProgressBar` | Visual indicator of processing progress |
| `ErrorLog` | Log of any errors that occur during processing |

### Custom Hooks

| Hook | Description |
|----------|-------------|
| `useVideos` | Hook for managing video data |
| `useTrackSelection` | Hook for managing audio track selection |
| `useVideoProcessing` | Hook for handling video processing logic |
| `useSSE` | Hook for managing Server-Sent Events |

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.