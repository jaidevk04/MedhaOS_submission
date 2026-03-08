# 🏥 MedhaOS Patient Portal

Web-based patient portal with AI-powered voice triage and appointment booking.

## 🚀 Features

- **Voice Triage**: Record symptoms using voice or text
- **AI Assessment**: Get instant medical assessment with urgency scoring
- **Multi-language Support**: English, Hindi, and more
- **Appointment Booking**: Book with the right specialist
- **Patient Dashboard**: View appointments and medical records
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

- React.js
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- Lucide React Icons

## 📦 Installation

```bash
npm install
```

## 🏃 Running the App

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_WS_URL=ws://localhost:4000
```

## 📱 Pages

- `/` - Landing page
- `/triage` - Voice triage interface
- `/book-appointment` - Appointment booking
- `/dashboard` - Patient dashboard
- `/login` - Authentication
- `/confirmation/:id` - Appointment confirmation

## 🎤 Voice Recording

The app uses the browser's MediaRecorder API for voice recording:
- Supports WebM audio format
- Real-time recording indicator
- Pause/resume functionality
- Audio playback before submission

## 🔐 Browser Requirements

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Microphone permission required for voice features

## 📝 Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🌐 API Integration

The portal connects to the MedhaOS backend API:

- `POST /api/voice/transcribe` - Audio transcription
- `POST /api/voice/triage-conversation` - AI triage
- `POST /api/voice/analyze-symptoms` - Symptom analysis
- `POST /api/appointments/book` - Book appointment

## 🎨 Customization

Edit `tailwind.config.js` to customize colors and theme.

## 📄 License

Part of the MedhaOS Healthcare Platform
