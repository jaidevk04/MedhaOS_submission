import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Send, Loader2, CheckCircle, MessageCircle, Volume2, Phone, PhoneOff, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveVoice } from '../hooks/useLiveVoice';
import { authAPI } from '../services/api';

const VoiceTriagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const language = location.state?.language || localStorage.getItem('preferred_language') || 'en';
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const {
    isActive,
    isListening,
    error: voiceError,
    currentTranscript,
    messages,
    startSession,
    startListening,
    stopListening,
    sendMessage,
    endSession,
  } = useLiveVoice(language);

  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const info = authAPI.getPatientInfo();
    if (info) {
      setPatientInfo(info);
    }
    
    // Initialize Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  // Initialize session on mount
  useEffect(() => {
    // Only initialize once
    if (isActive || loading) return;

    const initSession = async () => {
      try {
        setLoading(true);
        // Start session even if patientInfo is null (guest mode)
        await startSession(patientInfo?.id || null);
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    return () => {
      endSession();
    };
  }, []); // Run only on mount

  const handleStartLiveConversation = async () => {
    try {
      await startListening();
    } catch (err) {
      console.error('Failed to start listening:', err);
    }
  };

  const handleStopLiveConversation = async () => {
    stopListening();
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    await sendMessage(textInput);
    setTextInput('');
  };

  const handleBookAppointment = () => {
    navigate('/book-appointment', {
      state: {
        triageData: finalAssessment,
        language,
      },
    });
  };

  const handleEndSession = async () => {
    try {
      await endSession();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-4">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {language === 'hi' ? '🎤 लाइव वॉइस ट्राइएज' : '🎤 Live Voice Triage'}
          </h1>
          <p className="text-sm text-gray-600">
            {language === 'hi' 
              ? 'AI के साथ लाइव बातचीत करें - बोलें या टाइप करें'
              : 'Live conversation with AI - Speak or Type'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Chat Messages */}
          <div className="lg:col-span-2">
            {/* Live Status Banner */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card mb-3 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300' 
                    : isSpeaking
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300'
                    : 'bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isListening ? (
                      <>
                        <div className="relative">
                          <Radio className="w-6 h-6 text-red-600 animate-pulse" />
                          <div className="absolute inset-0 animate-ping">
                            <Radio className="w-6 h-6 text-red-400" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-red-700">
                            {language === 'hi' ? '🔴 लाइव - आप बोल रहे हैं...' : '🔴 LIVE - You\'re Speaking...'}
                          </p>
                          <p className="text-xs text-red-600">
                            {language === 'hi' ? 'AI सुन रहा है' : 'AI is listening'}
                          </p>
                        </div>
                      </>
                    ) : isSpeaking ? (
                      <>
                        <Volume2 className="w-6 h-6 text-purple-600 animate-pulse" />
                        <div>
                          <p className="font-bold text-purple-700">
                            {language === 'hi' ? '🔊 AI बोल रहा है...' : '🔊 AI is Speaking...'}
                          </p>
                          <p className="text-xs text-purple-600">
                            {language === 'hi' ? 'सुन रहे हैं' : 'Listening to response'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-semibold text-green-700">
                            {language === 'hi' ? '✅ सत्र सक्रिय' : '✅ Session Active'}
                          </p>
                          <p className="text-xs text-green-600">
                            {language === 'hi' ? 'बोलने के लिए तैयार' : 'Ready to talk'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSpeaking && (
                      <button
                        onClick={handleStopSpeaking}
                        className="text-xs px-3 py-1 rounded-full bg-purple-200 hover:bg-purple-300 text-purple-700 font-medium"
                      >
                        {language === 'hi' ? '🔇 रोकें' : '🔇 Stop'}
                      </button>
                    )}
                    <button
                      onClick={handleEndSession}
                      className="text-xs px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                    >
                      {language === 'hi' ? 'समाप्त करें' : 'End'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef} 
              className="card mb-3 h-[calc(100vh-380px)] overflow-y-auto scroll-smooth"
            >
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    if (message.type === 'system') {
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center my-2"
                        >
                          <div className="bg-gray-100 border border-gray-200 text-xs text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                            {message.toolName === 'record_symptoms_and_precautions' && (
                              <>
                                <MessageCircle className="w-4 h-4 text-blue-500" />
                                <span>{language === 'hi' ? 'मॉडल ने लक्षणों और सावधानियों को अपडेट किया' : 'Model recorded symptoms & precautions'}</span>
                              </>
                            )}
                            {message.toolName === 'complete_triage' && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{language === 'hi' ? 'मॉडल ने ट्राइएज पूरा किया' : 'Model completed triage assessment'}</span>
                              </>
                            )}
                            {message.toolName === 'book_appointment' && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{language === 'hi' ? 'मॉडल ने अपॉइंटमेंट बुक किया' : 'Model booked an appointment'}</span>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.type === 'user'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === 'ai' && (
                              <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-600" />
                            )}
                            {message.type === 'user' && message.isVoice ? (
                              <div className="flex items-center gap-2">
                                <Mic className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium italic">{language === 'hi' ? 'वॉइस इनपुट' : 'Voice Input'}</span>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Live Transcription */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] rounded-lg p-3 bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
                        <p className="text-sm font-semibold text-blue-700">
                          {language === 'hi' ? 'बोल रहे हैं...' : 'Speaking...'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                        <p className="text-xs text-gray-600">
                          {language === 'hi' ? 'AI सोच रहा है...' : 'AI is thinking...'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            {!conversationComplete && (
              <div className="card bg-gradient-to-r from-white to-gray-50">
                {/* Live Conversation Button */}
                <button
                  onClick={isListening ? handleStopLiveConversation : handleStartLiveConversation}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 mb-3 ${
                    isListening
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-200 animate-pulse'
                      : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white shadow-lg shadow-primary-200'
                  }`}
                  disabled={loading || !isActive || isSpeaking}
                >
                  {isListening ? (
                    <>
                      <PhoneOff className="w-6 h-6" />
                      {language === 'hi' ? '🔴 बातचीत रोकें' : '🔴 Stop Talking'}
                    </>
                  ) : (
                    <>
                      <Phone className="w-6 h-6" />
                      {language === 'hi' ? '🎤 लाइव बातचीत शुरू करें' : '🎤 Start Live Conversation'}
                    </>
                  )}
                </button>

                {/* Text Input Alternative */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">
                      {language === 'hi' ? 'या' : 'OR'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleTextSubmit} className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'यहाँ टाइप करें...'
                        : 'Type your message here...'
                    }
                    className="input-field flex-1 text-sm"
                    disabled={loading || isListening || isSpeaking}
                  />
                  <button
                    type="submit"
                    disabled={loading || !textInput.trim() || isListening || isSpeaking}
                    className="btn-primary px-6"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {voiceError && (
                  <p className="text-red-600 text-xs mt-2">{voiceError}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Info Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-3">
              {/* Current Symptoms */}
              {messages.some(m => m.data?.symptoms_identified) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card bg-blue-50"
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {language === 'hi' ? 'पहचाने गए लक्षण' : 'Identified Symptoms'}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {messages
                      .filter(m => m.data?.symptoms_identified)
                      .flatMap(m => m.data.symptoms_identified)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((symptom, i) => (
                        <span
                          key={i}
                          className="bg-primary-600 text-white px-2 py-1 rounded text-xs"
                        >
                          {symptom}
                        </span>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Immediate Precautions */}
              {messages.some(m => m.data?.immediate_precautions?.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card bg-yellow-50 border border-yellow-200"
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {language === 'hi' ? '⚠️ तत्काल सावधानियां' : '⚠️ Immediate Precautions'}
                  </h3>
                  <ul className="space-y-1">
                    {messages
                      .filter(m => m.data?.immediate_precautions)
                      .flatMap(m => m.data.immediate_precautions)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((precaution, i) => (
                        <li key={i} className="flex items-start gap-1 text-xs text-gray-900">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span>{precaution}</span>
                        </li>
                      ))}
                  </ul>
                </motion.div>
              )}

              {/* Booked Appointment */}
              {messages.some(m => m.data?.appointment_booked) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card bg-green-50 border border-green-200"
                >
                  <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {language === 'hi' ? 'अपॉइंटमेंट बुक हो गया' : 'Appointment Booked'}
                  </h3>
                  {messages
                    .filter(m => m.data?.appointment_booked)
                    .map((m, idx) => (
                      <div key={idx} className="text-xs text-gray-800 space-y-1">
                        <p><span className="font-semibold">Date:</span> {m.data.appointment_details.date}</p>
                        <p><span className="font-semibold">Time:</span> {m.data.appointment_details.time}</p>
                        <p><span className="font-semibold">Specialty:</span> {m.data.appointment_details.specialty}</p>
                        <p><span className="font-semibold">ID:</span> {m.data.appointment_details.appointment_id}</p>
                      </div>
                    ))
                  }
                </motion.div>
              )}

              {/* Final Assessment */}
              {conversationComplete && finalAssessment && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      {language === 'hi' ? 'मूल्यांकन पूर्ण' : 'Assessment Complete'}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {finalAssessment.empathy_response && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          {language === 'hi' ? 'तत्काल सलाह:' : 'Immediate Advice:'}
                        </p>
                        <p className="text-xs text-gray-900">{finalAssessment.empathy_response}</p>
                      </div>
                    )}

                    <button
                      onClick={handleBookAppointment}
                      className="btn-primary w-full text-sm py-2.5"
                    >
                      {language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Help Info */}
              {!conversationComplete && (
                <div className="card bg-gray-50 text-xs text-gray-600">
                  <p className="font-semibold mb-1">
                    {language === 'hi' ? '💡 सुझाव' : '💡 Tips'}
                  </p>
                  <ul className="space-y-1">
                    <li>• {language === 'hi' ? 'विस्तार से बताएं' : 'Be specific about your symptoms'}</li>
                    <li>• {language === 'hi' ? 'कब शुरू हुआ बताएं' : 'Mention when it started'}</li>
                    <li>• {language === 'hi' ? 'दर्द की तीव्रता बताएं' : 'Describe pain intensity'}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTriagePage;
