import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:4000';

export const useLiveVoice = (language = 'en') => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  
  // Real-time conversation states
  const [messages, setMessages] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationComplete, setConversationComplete] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState(null);
  const currentAiResponseRef = useRef('');

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const playbackContextRef = useRef(null);
  
  // Audio playback queue
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  useEffect(() => {
    // Initialize Web Audio API for playback
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    return () => {
      stopListening();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (playbackContextRef.current) {
        playbackContextRef.current.close();
      }
    };
  }, []);

  const scheduleAudioQueue = async () => {
    if (!playbackContextRef.current) return;

    if (playbackContextRef.current.state === 'suspended') {
      await playbackContextRef.current.resume();
    }

    // Ensure our next start time isn't in the past
    const currentTime = playbackContextRef.current.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      // Add a tiny buffer so it doesn't instantly play while processing
      nextStartTimeRef.current = currentTime + 0.05; 
    }

    while (audioQueueRef.current.length > 0) {
      const base64Audio = audioQueueRef.current.shift();

      try {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const pcmData = new Int16Array(bytes.buffer);
        const audioBuffer = playbackContextRef.current.createBuffer(1, pcmData.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
        }
        
        const source = playbackContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackContextRef.current.destination);

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;

        source.onended = () => {
           // Once playback reaches the last scheduled chunk, stop playing
           if (playbackContextRef.current && playbackContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
             isPlayingRef.current = false;
           }
        };
      } catch (err) {
        console.error('Error scheduling PCM audio:', err);
      }
    }
  };

  const playPCMAudio = (base64Audio) => {
    audioQueueRef.current.push(base64Audio);
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
    }
    scheduleAudioQueue();
  };

  const startSession = useCallback(async (patientId = null) => {
    try {
      setError(null);
      setMessages([]);
      setConversationComplete(false);
      setFinalAssessment(null);
      
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('start_live_voice', { language, patient_id: patientId });
      });

      socketRef.current.on('live_voice_started', () => {
        setIsActive(true);
      });

      socketRef.current.on('live_voice_audio', (data) => {
        playPCMAudio(data.audio);
      });

      socketRef.current.on('live_voice_text', (data) => {
        if (data.role === 'user') {
           setMessages(prev => {
             const newMessages = [...prev];
             // If the last message is already a user voice input, just append text instead of creating a new card
             if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'user' && newMessages[newMessages.length - 1].isVoice) {
                newMessages[newMessages.length - 1].text += ' ' + data.text;
             } else {
                newMessages.push({
                  type: 'user',
                  isVoice: true,
                  text: data.text,
                  timestamp: new Date().toISOString(),
                  isComplete: true,
                });
             }
             return newMessages;
           });
           setCurrentTranscript('');
        } else {
           // Accumulate AI response text
           currentAiResponseRef.current += data.text;
           
           setMessages(prev => {
             const newMessages = [...prev];
             // If the last message is from the AI, append to it instead of creating a new one
             if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'ai' && !newMessages[newMessages.length - 1].isComplete) {
                newMessages[newMessages.length - 1].text = currentAiResponseRef.current;
             } else {
                newMessages.push({
                  type: 'ai',
                  text: currentAiResponseRef.current,
                  timestamp: new Date().toISOString(),
                  isComplete: false,
                });
             }
             return newMessages;
           });
        }
      });

      socketRef.current.on('live_voice_turn_complete', () => {
        // Mark the last AI message as complete
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'ai') {
             newMessages[newMessages.length - 1].isComplete = true;
          }
          return newMessages;
        });
        currentAiResponseRef.current = '';
      });

      socketRef.current.on('live_voice_symptoms_updated', (args) => {
        setMessages(prev => [...prev, {
          type: 'system',
          toolName: 'record_symptoms_and_precautions',
          data: {
            symptoms_identified: args.symptoms || [],
            immediate_precautions: args.precautions || [],
          },
          timestamp: new Date().toISOString(),
          isComplete: true,
        }]);
      });

      socketRef.current.on('live_voice_assessment_complete', (args) => {
        setMessages(prev => [...prev, {
          type: 'system',
          toolName: 'complete_triage',
          data: {
            assessment_complete: true,
            assessment_summary: args.assessment_summary,
            urgency_level: args.urgency_level,
          },
          timestamp: new Date().toISOString(),
          isComplete: true,
        }]);
        setConversationComplete(true);
        setFinalAssessment({
          empathy_response: args.assessment_summary,
          urgency_score: args.urgency_level === 'emergency' ? 100 : args.urgency_level === 'urgent' ? 70 : 30,
        });
      });

      socketRef.current.on('live_voice_appointment_booked', (args) => {
        setMessages(prev => [...prev, {
          type: 'system',
          toolName: 'book_appointment',
          data: {
            appointment_booked: true,
            appointment_details: args,
          },
          timestamp: new Date().toISOString(),
          isComplete: true,
        }]);
      });

      socketRef.current.on('live_voice_end_session_requested', () => {
        // Automatically end the session when requested by AI
        setTimeout(() => endSession(), 2000); // Small delay to allow final audio to play
      });

      socketRef.current.on('live_voice_interrupted', () => {
        console.log("AI was interrupted by user");
        // Mark current AI message as complete so it doesn't get overwritten
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'ai') {
             newMessages[newMessages.length - 1].isComplete = true;
          }
          return newMessages;
        });
        currentAiResponseRef.current = '';
        
        // Stop current audio playback
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        if (playbackContextRef.current) {
           playbackContextRef.current.close();
           playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
           nextStartTimeRef.current = 0;
        }
      });

      socketRef.current.on('live_voice_error', (data) => {
        setError(data.message);
      });

      socketRef.current.on('live_voice_closed', () => {
        setIsActive(false);
        stopListening();
      });

      // Provide initial local message based on language since we removed REST response
      const welcomeMessage = language === 'hi' 
        ? 'नमस्ते! मैं आपकी मदद के लिए यहाँ हूँ। अपने लक्षणों के बारे में बताएं।' 
        : "Hello! I'm here to help you. Please tell me about your symptoms.";
      
      return { message: welcomeMessage };

    } catch (err) {
      setError('Failed to start session');
      console.error('Start session error:', err);
      throw err;
    }
  }, [language]);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      audioInputRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Use ScriptProcessorNode as a fallback since AudioWorklet needs a separate file
      processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      audioInputRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        if (!socketRef.current || !isActive) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert Int16Array to base64
        const buffer = new ArrayBuffer(pcmData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcmData.length; i++) {
          view.setInt16(i * 2, pcmData[i], true); // little-endian
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = window.btoa(binary);

        socketRef.current.emit('live_voice_audio_chunk', { audio: base64Audio });
      };

      setIsListening(true);
    } catch (err) {
      setError('Failed to access microphone');
      console.error('Start listening error:', err);
      throw err;
    }
  }, [isActive]);

  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (audioInputRef.current) {
      audioInputRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsListening(false);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!socketRef.current) {
      throw new Error('No active session');
    }
    
    // Add to local UI
    setMessages(prev => [...prev, {
      type: 'user',
      text,
      timestamp: new Date().toISOString(),
    }]);

    socketRef.current.emit('live_voice_text_message', { text });
  }, []);

  const endSession = useCallback(async () => {
    try {
      stopListening();
      if (socketRef.current) {
        socketRef.current.emit('stop_live_voice');
        socketRef.current.disconnect();
      }
      setIsActive(false);
      setCurrentTranscript('');
    } catch (err) {
      setError('Failed to end session');
      console.error('End session error:', err);
      throw err;
    }
  }, [stopListening]);

  return {
    isActive,
    isListening,
    error,
    currentTranscript,
    messages,
    conversationComplete,
    finalAssessment,
    startSession,
    startListening,
    stopListening,
    sendMessage,
    endSession,
  };
};
