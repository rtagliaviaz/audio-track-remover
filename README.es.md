# Audio Track Remover
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)

Aplicacion web local para eliminar pistas de audio de archivos de video usando FFmpeg. Desarrollado con React, Node.js y TypeScript.

[Inglés](README.md) | Español

## Index
- [Demo](#demo)
- [Uso](#uso)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Características](#características)
- [Inicio Rápido](#inicio-rápido)
- [Backend](#backend)
- [Frontend](#frontend)
- [Licencia](#licencia)

## Demo

<!-- [![Video Demo](https://img.youtube.com/vi/TU_VIDEO_ID/0.jpg)](https://youtu.be/TU_VIDEO_ID)

> Mira el video de demostración para ver la herramienta en acción. -->

## Uso

1. Coloca tus videos en la `VIDEO_FOLDER_PATH` configurada (default: `backend/videos/`)
2. Abre la aplicación en tu navegador (`http://localhost:5173`)
3. La lista de videos se cargará automáticamente
4. Haz clic en un video para ver sus pistas de audio
5. Selecciona/deselecciona las pistas de audio
6. Marca el checkbox en los videos para seleccionarlos para procesamiento por lotes
7. Haz clic en el botón **Process**
8. Observa la barra de progreso en tiempo real via SSE
9. Los videos procesados se guardan en `OUTPUT_FOLDER_PATH` (default: `backend/outputs/`)

## Tecnologías

| Capa (Layer) | Tecnología |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Procesamiento de Video | FFmpeg (fluent-ffmpeg) |
| Actualizaciones en Tiempo Real | Server-Sent Events (SSE) |
| Colas | Cola de procesamiento en memoria |
| Tests | Vitest |

## Arquitectura

```text
┌─────────────────────────────────────────────────────────────┐
│                    AUDIO TRACK REMOVER                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + TypeScript)                              │
│  ├── Seleccionar múltiples videos                           │
│  ├── Elegir pistas de audio por video                       │
│  └── Progreso en tiempo real via SSE                        │
│                         │                                   │
│                         ▼                                   │
│  Backend (Node.js + Express)                                │
│  ├── /api/videos        → Listar videos                     │
│  ├── /api/video-info    → Obtener pistas de audio           │
│  ├── /api/process       → Agregar a la cola                 │
│  └── /api/events        → Actualizaciones SSE               │
│                         │                                   │
│                         ▼                                   │
│  Cola de Procesamiento (en memoria)                         │
│  └── FFmpeg elimina las pistas seleccionadas                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Características

- Seleccionar múltiples videos a la vez
- Ver y seleccionar qué pistas de audio conservar (o eliminar todas)
- Procesamiento por lotes con progreso en tiempo real (SSE)
- Persistencia de selección de pistas por video
- Registro de errores para saber qué videos fallaron y por qué
- Configurable via `.env` (carpeta de videos, carpeta de salida)
- 100% local – sin dependencias de nube, sin subidas de archivos

## Quick Start

### Requisitos previos
- [Node.js](https://nodejs.org/) 18+
- [FFmpeg](https://ffmpeg.org/download.html) instalado y en el PATH

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/rtagliaviaz/audio-track-remover.git
cd audio-track-remover

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### Configuración

Crear un archivo `.env` en el directorio `backend/`:
```env
# Carpeta de videos (donde están tus videos)
VIDEO_FOLDER_PATH=./videos

# Carpeta de salida (donde se guardarán los videos procesados)
OUTPUT_FOLDER_PATH=./outputs

# Puerto del servidor (default: 3001)
PORT=3001
```

### Ejecutar la aplicación
```bash
# Terminal 1: Iniciar el backend
cd backend
npm run dev

# Terminal 2: Iniciar el frontend
cd frontend
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

## Backend

### Estructura
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

### Variables de Entorno

| Variable | Description | Default |
|----------|-------------|---------|
| `VIDEO_FOLDER_PATH` | Carpeta donde se leen los videos | `./videos` |
| `OUTPUT_FOLDER_PATH` | Carpeta donde se guardan los videos procesados | `./outputs` |
| `PORT` | Puerto del servidor | `3001` |


### Endpoints de la API

#### `GET /api/videos`

Listar todos los videos en la carpeta configurada.

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
Obtener pistas de audio e información de un video.

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
Agregar un video a la cola de procesamiento.

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

Endpoint SSE para progreso en tiempo real.

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

Obtener el estado actual de la cola.

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

Obtener la ruta de salida donde los videos procesados serán guardados.

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

### Estructura
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

### Componentes

| Componente | Descripción |
|----------|-------------|
| `VideoList` | Muestra videos con checkboxes para selección por lotes |
| `TrackList` | Lista las pistas de audio por video |
| `VideoProcessor` | Maneja la UI de procesamiento y controles |
| `StatusBar` | Muestra mensajes de estado y errores |
| `ProgressBar` | Indicador de progreso en tiempo real |
| `ErrorLog` | Muestra qué videos fallaron y por qué |

### Custom Hooks

| Hook | Descripción |
|----------|-------------|
| `useVideos` | Obtener lista de videos e información del backend |
| `useTrackSelection` | Manejar el estado de selección de pistas por video |
| `useVideoProcessing` | Manejar la lógica de procesamiento individual y por lotes |
| `useSSE` | Escuchar actualizaciones de progreso via Server-Sent Events |

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](./LICENSE) para más detalles.