import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import { config, ensureDirectories } from './config';

dotenv.config();

const app = express();
const PORT = config.port;

ensureDirectories();

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Video folder: ${config.videoFolder}`);
    console.log(`Output folder: ${config.outputFolder}`);
});