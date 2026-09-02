import express from 'express';
import { videoController } from '../controllers/videoController';
import { queueController } from '../controllers/queueController';

const router = express.Router();

router.get('/videos', videoController.listVideos);
router.post('/video-info', videoController.getVideoInfo);
router.post('/process', videoController.processVideo);

router.get('/output-folder', videoController.getOutputFolder);

router.get('/queue/status', queueController.getStatus);
router.get('/events', queueController.events);

export default router;