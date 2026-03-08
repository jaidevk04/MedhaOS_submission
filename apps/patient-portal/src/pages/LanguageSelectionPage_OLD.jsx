import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LanguageSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nextPage = location.state?.nextPage || '/triage';

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  ];

  const handleLanguageSelect = (languageCode) => {
    // Store selected language in localStorage
    localStorage.setItem('preferred_language', languageCode);
    
    // Navigate to the next page
    navigate(nextPage, { state: { language: languageCode } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Globe className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Select Your Language
          </h1>
          <p className="text-gray-600">
            Choose your preferred language for communication
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleLanguageSelect(lang.code)}
              className="card hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {lang.nativeName}
                  </h3>
                  <p className="text-sm text-gray-600">{lang.name}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-primary-600 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionPage;
