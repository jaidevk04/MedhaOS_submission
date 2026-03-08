import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, User, Loader2 } from 'lucide-react';

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  const language = location.state?.language || 'en';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {language === 'hi' ? 'अपॉइंटमेंट की पुष्टि हो गई!' : 'Appointment Confirmed!'}
          </h1>
          <p className="text-sm text-gray-600">
            {language === 'hi' 
              ? 'आपकी अपॉइंटमेंट सफलतापूर्वक बुक हो गई है'
              : 'Your appointment has been successfully booked'}
          </p>
        </div>

        <div className="card mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'hi' ? 'अपॉइंटमेंट विवरण' : 'Appointment Details'}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-600">
                  {language === 'hi' ? 'रोगी का नाम' : 'Patient Name'}
                </p>
                <p className="font-semibold text-gray-900">{appointment.patient_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-600">
                  {language === 'hi' ? 'तारीख' : 'Date'}
                </p>
                <p className="font-semibold text-gray-900">{formatDate(appointment.scheduled_time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-600">
                  {language === 'hi' ? 'समय' : 'Time'}
                </p>
                <p className="font-semibold text-gray-900">{formatTime(appointment.scheduled_time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-600">
                  {language === 'hi' ? 'विशेषज्ञता' : 'Specialty'}
                </p>
                <p className="font-semibold text-gray-900">{appointment.specialty}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-600">
                  {language === 'hi' ? 'स्थान' : 'Location'}
                </p>
                <p className="font-semibold text-gray-900">MedhaOS Hospital</p>
                <p className="text-xs text-gray-600">123 Healthcare Ave, Medical District</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">
              {language === 'hi' ? 'अपॉइंटमेंट आईडी' : 'Appointment ID'}
            </p>
            <p className="font-mono text-sm text-gray-900 font-semibold">
              {appointmentId}
            </p>
          </div>
        </div>

        <div className="card bg-blue-50 border border-blue-200 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            {language === 'hi' ? 'अपॉइंटमेंट से पहले' : 'Before Your Appointment'}
          </h3>
          <ul className="space-y-1 text-xs text-gray-700">
            <li>• {language === 'hi' ? '15 मिनट पहले पहुंचें' : 'Arrive 15 minutes early'}</li>
            <li>• {language === 'hi' ? 'अपना आईडी और बीमा कार्ड लाएं' : 'Bring your ID and insurance card'}</li>
            <li>• {language === 'hi' ? 'पिछले मेडिकल रिकॉर्ड लाएं' : 'Bring any previous medical records'}</li>
            <li>• {language === 'hi' ? 'वर्तमान दवाओं की सूची' : 'List of current medications'}</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex-1 text-sm py-2"
          >
            {language === 'hi' ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-outline flex-1 text-sm py-2"
          >
            {language === 'hi' ? 'होम पर वापस जाएं' : 'Back to Home'}
          </button>
        </div>

        <div className="text-center mt-4 text-xs text-gray-600">
          <p>
            {language === 'hi' 
              ? 'पुष्टिकरण आपके ईमेल और फोन पर भेजी गई'
              : 'Confirmation sent to your email and phone'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
