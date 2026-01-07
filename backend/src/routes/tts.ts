import express from 'express';
import textToSpeech from '@google-cloud/text-to-speech';

const router = express.Router();

/**
 * POST /api/v1/tts
 * Generate text-to-speech audio using Google Cloud TTS
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.GOOGLE_CLOUD_TTS_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_CLOUD_TTS_API_KEY not configured' });
    }

    // Initialize Google Cloud TTS client
    const client = new textToSpeech.TextToSpeechClient({
      apiKey: process.env.GOOGLE_CLOUD_TTS_API_KEY,
    });

    // Configure the TTS request
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-GB',
        name: 'en-GB-Neural2-B', // Natural British male voice
        ssmlGender: 'MALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 1.0,
        pitch: 0.0,
      },
    };

    // Generate speech
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content generated');
    }

    // Convert audio to base64
    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');

    res.json({
      audio: audioBase64,
      contentType: 'audio/mpeg',
    });

  } catch (error: any) {
    console.error('TTS error:', error.message);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

