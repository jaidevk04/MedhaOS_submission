# Speech & NLP Service

Multilingual speech and NLP infrastructure for MedhaOS Healthcare Platform.

## Features

### Speech Processing (via Bhashini API)
- **Speech-to-Text (STT)**: Convert audio to text in 22+ Indian languages
- **Text-to-Speech (TTS)**: Generate natural-sounding speech from text
- **Language Detection**: Automatically detect language from text
- **Translation**: Translate between Indian languages
- **Code-Switching**: Handle mixed-language text (Hinglish, Tamlish, etc.)

### Supported Languages
Hindi, English, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Odia, Assamese, Urdu, Sanskrit, Kashmiri, Nepali, Sindhi, Konkani, Maithili, Dogri, Manipuri, Santali

## API Endpoints

### Speech-to-Text
```bash
POST /api/speech/stt
Content-Type: multipart/form-data

Parameters:
- audio: Audio file (wav, mp3, flac, ogg)
- sourceLanguage: Language code (e.g., 'hi', 'en', 'ta')
- audioFormat: Optional (default: 'wav')
- sampleRate: Optional (default: 16000)

Response:
{
  "success": true,
  "data": {
    "transcription": "मुझे सीने में दर्द है",
    "confidence": 0.9,
    "detectedLanguage": "hi",
    "duration": 0,
    "processingTime": 1234
  }
}
```

### Text-to-Speech
```bash
POST /api/speech/tts
Content-Type: application/json

Body:
{
  "text": "Hello, how are you?",
  "targetLanguage": "hi",
  "voice": "female",
  "speed": 1.0
}

Response: Audio file (audio/wav)
```

### Translation
```bash
POST /api/speech/translate
Content-Type: application/json

Body:
{
  "text": "I have chest pain",
  "sourceLanguage": "en",
  "targetLanguage": "hi"
}

Response:
{
  "success": true,
  "data": {
    "translatedText": "मुझे सीने में दर्द है",
    "sourceLanguage": "en",
    "targetLanguage": "hi",
    "confidence": 0.9,
    "processingTime": 567
  }
}
```

### Language Detection
```bash
POST /api/speech/detect-language
Content-Type: application/json

Body:
{
  "text": "मुझे सीने में दर्द है"
}

Response:
{
  "success": true,
  "data": {
    "detectedLanguage": "hi",
    "confidence": 0.95,
    "alternativeLanguages": [
      { "language": "mr", "confidence": 0.03 },
      { "language": "ne", "confidence": 0.02 }
    ]
  }
}
```

### Code-Switching Handler
```bash
POST /api/speech/code-switching
Content-Type: application/json

Body:
{
  "text": "Mujhe chest pain ho raha hai",
  "primaryLanguage": "hi",
  "secondaryLanguage": "en"
}

Response:
{
  "success": true,
  "data": {
    "segments": [
      { "text": "Mujhe", "language": "hi", "startIndex": 0, "endIndex": 5 },
      { "text": "chest", "language": "en", "startIndex": 6, "endIndex": 11 },
      { "text": "pain", "language": "en", "startIndex": 12, "endIndex": 16 },
      { "text": "ho", "language": "hi", "startIndex": 17, "endIndex": 19 },
      { "text": "raha", "language": "hi", "startIndex": 20, "endIndex": 24 },
      { "text": "hai", "language": "hi", "startIndex": 25, "endIndex": 28 }
    ],
    "primaryLanguage": "hi",
    "secondaryLanguage": "en",
    "mixRatio": 60
  }
}
```

### Combined STT + Translation
```bash
POST /api/speech/stt-translate
Content-Type: multipart/form-data

Parameters:
- audio: Audio file
- sourceLanguage: Source language code
- targetLanguage: Target language code
- audioFormat: Optional

Response:
{
  "success": true,
  "data": {
    "original": {
      "transcription": "मुझे सीने में दर्द है",
      "confidence": 0.9,
      "detectedLanguage": "hi",
      "duration": 0,
      "processingTime": 1234
    },
    "translated": {
      "translatedText": "I have chest pain",
      "sourceLanguage": "hi",
      "targetLanguage": "en",
      "confidence": 0.9,
      "processingTime": 567
    }
  }
}
```

### Get Supported Languages
```bash
GET /api/speech/supported-languages

Response:
{
  "success": true,
  "data": {
    "languages": ["hi", "en", "ta", "te", ...],
    "defaultLanguage": "hi"
  }
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Bhashini API credentials
```

3. Run in development:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Environment Variables

- `PORT`: Service port (default: 3003)
- `NODE_ENV`: Environment (development/production)
- `BHASHINI_API_URL`: Bhashini API endpoint
- `BHASHINI_API_KEY`: Your Bhashini API key
- `BHASHINI_USER_ID`: Your Bhashini user ID
- `AWS_REGION`: AWS region for fallback services
- `MAX_AUDIO_SIZE_MB`: Maximum audio file size (default: 10MB)
- `SUPPORTED_LANGUAGES`: Comma-separated language codes
- `DEFAULT_LANGUAGE`: Default language (default: 'hi')

## Integration with Bhashini

This service integrates with the Government of India's Bhashini platform for multilingual AI capabilities. To use this service:

1. Register at https://bhashini.gov.in/
2. Obtain API credentials (API key and User ID)
3. Configure credentials in `.env` file

## Architecture

```
┌─────────────────────────────────────────┐
│         Speech & NLP Service            │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Bhashini Service Wrapper        │ │
│  │   - STT (Speech-to-Text)          │ │
│  │   - TTS (Text-to-Speech)          │ │
│  │   - Translation                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Language Detection Service      │ │
│  │   - Script-based detection        │ │
│  │   - Confidence scoring            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Code-Switching Service          │ │
│  │   - Segment identification        │ │
│  │   - Mixed-language handling       │ │
│  │   - Normalization                 │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Usage Examples

### Patient Triage Flow
```javascript
// 1. Patient speaks in Hindi
const audioFile = fs.readFileSync('patient-audio.wav');

// 2. Convert to text
const sttResponse = await fetch('http://localhost:3003/api/speech/stt', {
  method: 'POST',
  body: formData,
});

// 3. Translate to English for doctor
const translation = await fetch('http://localhost:3003/api/speech/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: sttResponse.data.transcription,
    sourceLanguage: 'hi',
    targetLanguage: 'en',
  }),
});

// 4. Generate voice response in Hindi
const ttsResponse = await fetch('http://localhost:3003/api/speech/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'आपकी नियुक्ति की पुष्टि हो गई है',
    targetLanguage: 'hi',
    voice: 'female',
  }),
});
```

## Performance

- STT latency: < 2 seconds (target: 90% of requests)
- TTS latency: < 3 seconds
- Translation latency: < 1 second
- Language detection: < 100ms

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 500: Internal server error

## Requirements Addressed

- **Requirement 1.1**: Multilingual interface supporting 22+ Indian languages
- **Requirement 1.2**: Speech transcription with 90% accuracy within 2 seconds
- **Requirement 12.2**: Automated follow-up in patient's preferred language
- **Requirement 12.3**: Medication verification using image recognition

## Next Steps

After completing this subtask, proceed to:
- Subtask 5.2: Implement clinical NLP pipeline
- Subtask 5.3: Create voice interface components
