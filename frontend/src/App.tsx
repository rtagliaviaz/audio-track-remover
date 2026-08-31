import React, { useState } from 'react';
import axios from 'axios';
import { FileUpload } from './components/FileUpload';
import { TrackList } from './components/TrackList';
import { ProgressBar } from './components/ProgressBar';

interface AudioTrack {
  index: number;
  codec: string;
  language: string;
  channels: number;
}

interface UploadedFile {
  path: string;
  name: string;
  size: number;
}

function App() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [processed, setProcessed] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setProcessed(false);
    setUploadProgress(0);
    setProcessProgress(0);
    setStatus('Uploading...');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            setStatus(`Uploading... ${percent}%`);
          }
        },
      });

      setFile(response.data.file);
      setTracks(response.data.tracks);
      setSelectedTracks(response.data.tracks.map((t: AudioTrack) => t.index));
      setUploadProgress(100);
      setStatus('Upload complete');
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
      setStatus('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setProcessed(false);
    setProcessProgress(0);
    setStatus('Processing...');

    try {

      const fileExt = file.name.split('.').pop();

      // Simular progreso
      setProcessProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProcessProgress(30);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProcessProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProcessProgress(70);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProcessProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await axios.post('/api/process', {
        filePath: file.path,
        tracksToKeep: selectedTracks,
        outputFormat: fileExt,
      });

      setProcessProgress(100);
      setStatus('Done');
      setProcessed(true);

      console.log('✅ Video processed:', response.data.outputPath);

    } catch (err) {
      setError('Failed to process video');
      console.error(err);
      setStatus('Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleTrack = (index: number) => {
      setSelectedTracks(prev =>
          prev.includes(index)
              ? prev.filter(i => i !== index)
              : [...prev, index]
      );
  };

  const totalProgress = uploadProgress > 0 && uploadProgress < 100
    ? uploadProgress
    : processProgress;

  return (
    <div className="container">
      <h1>🎵 Audio Track Remover</h1>
      <p className="subtitle">Remove unwanted audio tracks from your videos</p>

      {status && (
        <div className="status-bar">
            <span>{status}</span>
        </div>
      )}

      <div className="card">
        <FileUpload onFileUpload={handleFileUpload} isLoading={loading} />
      </div>

      {error && (
        <div className="card" style={{ borderColor: '#f44336' }}>
          <p style={{ color: '#f44336' }}>❌ {error}</p>
        </div>
      )}

      {file && (
        <div className="card">
          <div className="file-info">
            <span className="name">📹 {file.name}</span>
            <span className="size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>

          <h3>Audio Tracks</h3>
          <TrackList
            tracks={tracks}
            selectedTracks={selectedTracks}
            onToggleTrack={toggleTrack}
            isLoading={loading}
          />

          <div className="actions">
              <button
                  className="btn btn-primary"
                  onClick={handleProcess}
                  disabled={loading || selectedTracks.length === 0 || !file}
              >
                  {loading ? 'Processing...' : 'Process Video'}
              </button>
              {selectedTracks.length === 0 && (
                  <span style={{ color: '#f44336', fontSize: '0.9rem', marginLeft: '1rem' }}>
                      Select at least one audio track
                  </span>
              )}
          </div>

          <ProgressBar progress={totalProgress} isLoading={loading} />

          {processed && (
            <p style={{ color: '#4CAF50', marginTop: '1rem' }}>
              ✅ Video processed successfully. File saved in backend/outputs/
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;