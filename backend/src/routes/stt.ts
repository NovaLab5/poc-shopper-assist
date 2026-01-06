import express from 'express';

const router = express.Router();

/**
 * POST /api/v1/stt
 * Convert speech to text using Google Cloud Speech-to-Text REST API
 */
router.post('/', async (req, res) => {
  try {
    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    if (!process.env.GOOGLE_CLOUD_STT_API_KEY) {
      return res.status(500).json({
        error: 'GOOGLE_CLOUD_STT_API_KEY not configured'
      });
    }

    // Remove data URL prefix if present (handles both simple and complex data URLs)
    const audioContent = audio.replace(/^data:audio\/[^,]+,/, '');

    console.log('Audio content length:', audioContent.length);
    console.log('First 50 chars:', audioContent.substring(0, 50));

    // Configure the STT request using REST API
    const requestBody = {
      audio: {
        content: audioContent,
      },
      config: {
        encoding: 'WEBM_OPUS',
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'default',
      },
    };

    // Call Google Cloud Speech-to-Text REST API directly
    const apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_STT_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Speech recognition failed',
        details: errorData,
      });
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.json({
        transcript: '',
        confidence: 0,
      });
    }

    const transcription = data.results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join(' ');

    const confidence = data.results[0]?.alternatives?.[0]?.confidence || 0;

    res.json({
      transcript: transcription,
      confidence: confidence,
    });

  } catch (error: any) {
    console.error('STT error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

