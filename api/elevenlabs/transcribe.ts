import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || '';

  if (!apiKey) {
    res.status(500).send('ElevenLabs API key not configured');
    return;
  }

  const { audioBase64, mimeType, isFinal } = req.body || {};

  if (!audioBase64) {
    res.status(400).send('Missing audio payload');
    return;
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const formData = new FormData();
    const fileName = isFinal ? 'audio-final.webm' : 'audio-partial.webm';
    const audioBlob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });

    formData.append('audio', audioBlob, fileName);

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).send(errorText || 'ElevenLabs transcription failed');
      return;
    }

    const data = await response.json();
    const text = data?.text || data?.transcript || '';

    res.status(200).json({ text });
  } catch (error: any) {
    console.error('[ElevenLabs] Transcription error:', error);
    res.status(500).send(error?.message || 'Unexpected transcription error');
  }
}
