// features/youtubeUploader/routes.js
import express from 'express';
import { driveToYoutubeWebhook, webhookStatus } from './handlers.js';

const router = express.Router();

// Rota do webhook para processar arquivo do Drive
router.post('/drive-to-youtube', driveToYoutubeWebhook);

// Rota de verificação de status
router.get('/status', webhookStatus);

export default router;
