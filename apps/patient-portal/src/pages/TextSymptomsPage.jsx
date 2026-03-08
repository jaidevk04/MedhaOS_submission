import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Loader2, MessageCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { conductTriageConversation } from '../services/voiceService';

const TextSymptomsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const language = location.state?.language || localStorage.getItem('preferred_language') || 'en';

  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: language === 'hi' 
        ? 'नमस्ते! मैं आपकी मदद के लिए यहाँ हूँ। कृपया अपने लक्षणों के बारे में बताएं।'
        : 'Hello! I\'m here to help you. Please describe your symptoms.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'patient' : 'ai',
        content: msg.text,
      }));

      const result = await conductTriageConversation(
        inputText,
        null,
        conversationHistory,
        language
      );

      const aiMessage = {
        type: 'ai',
        text: result.question, // This is now in the correct language from backend
        timestamp: new Date().toISOString(),
        data: result,
      };

      setMessages(prev => [...prev, aiMessage]);

      // If no more info needed, show final assessment
      if (!result.needs_more_info) {
        setConversationComplete(true);
        setFinalAssessment(result);
        
        // Store in localStorage for next page
        localStorage.setItem('triage_result', JSON.stringify(result));
        localStorage.setItem('encounter_id', result.encounter_id);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'ai',
        text: language === 'hi'
          ? 'क्षमा करें, कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate('/book-appointment', {
      state: {
        triageData: finalAssessment,
        language,
      },
    });
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
            {language === 'hi' ? 'लक्षण विवरण' : 'Describe Your Symptoms'}
          </h1>
          <p className="text-sm text-gray-600">
            {language === 'hi' 
              ? 'अपने लक्षणों के बारे में विस्तार से बताएं'
              : 'Tell us about your symptoms in detail'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Chat Messages */}
          <div className="lg:col-span-2">
            <div className="card mb-3 h-[calc(100vh-280px)] overflow-y-auto">
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message, index) => (
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
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input Form */}
            {!conversationComplete && (
              <form onSubmit={handleSendMessage} className="card">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'अपने लक्षण यहाँ टाइप करें...'
                        : 'I have difficulty in walking, no swelling, but its paining'
                    }
                    className="input-field flex-1 text-sm"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputText.trim()}
                    className="btn-primary px-4"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column - Assessment Info */}
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
                    {/* Immediate Advice */}
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

export default TextSymptomsPage;
