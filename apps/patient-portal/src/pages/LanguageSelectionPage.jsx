import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, ArrowRight, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const LanguageSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nextPage = location.state?.nextPage || '/triage';

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English',
      gradient: 'from-blue-500 to-cyan-500',
      flag: '🇬🇧'
    },
    { 
      code: 'hi', 
      name: 'Hindi', 
      nativeName: 'हिंदी',
      gradient: 'from-orange-500 to-amber-500',
      flag: '🇮🇳'
    },
    { 
      code: 'bn', 
      name: 'Bengali', 
      nativeName: 'বাংলা',
      gradient: 'from-green-500 to-emerald-500',
      flag: '🇧🇩'
    },
    { 
      code: 'ta', 
      name: 'Tamil', 
      nativeName: 'தமிழ்',
      gradient: 'from-red-500 to-pink-500',
      flag: '🇮🇳'
    },
    { 
      code: 'te', 
      name: 'Telugu', 
      nativeName: 'తెలుగు',
      gradient: 'from-purple-500 to-indigo-500',
      flag: '🇮🇳'
    },
    { 
      code: 'mr', 
      name: 'Marathi', 
      nativeName: 'मराठी',
      gradient: 'from-yellow-500 to-orange-500',
      flag: '🇮🇳'
    },
  ];

  const handleLanguageSelect = (languageCode) => {
    localStorage.setItem('preferred_language', languageCode);
    navigate(nextPage, { state: { language: languageCode } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden py-12 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-blue-200/30 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Globe className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-blue-700 bg-clip-text text-transparent mb-4">
            Select Your Language
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your preferred language for the best healthcare experience
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">AI supports all languages</span>
          </div>
        </motion.div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLanguageSelect(lang.code)}
              className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 overflow-hidden text-left"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${lang.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative">
                {/* Flag */}
                <div className="text-5xl mb-4">{lang.flag}</div>

                {/* Language Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {lang.nativeName}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{lang.name}</p>

                {/* Arrow Icon */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 bg-gradient-to-br ${lang.gradient} rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </motion.button>
          ))}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Multilingual AI Support</h3>
              <p className="text-sm text-gray-600">
                Our AI understands and responds in your preferred language. You can switch languages anytime from your dashboard.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Go Back
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionPage;
