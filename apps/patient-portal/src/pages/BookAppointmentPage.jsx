import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Loader2, CheckCircle } from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import { authAPI } from '../services/api';

const BookAppointmentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const triageData = location.state?.triageData;
  const language = location.state?.language || 'en';
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: 'morning',
    specialty: triageData?.recommended_specialty || '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientInfo, setPatientInfo] = useState(null);

  useEffect(() => {
    // Pre-fill if user is logged in
    const info = authAPI.getPatientInfo();
    if (info) {
      setPatientInfo(info);
      setFormData(prev => ({
        ...prev,
        fullName: info.name,
        email: info.email,
        phone: info.phone
      }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.fullName || !formData.preferredDate) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Map time slot to actual time
      const timeSlotMap = {
        'morning': '09:00',
        'afternoon': '14:00',
        'evening': '17:00'
      };

      const scheduledTime = `${formData.preferredDate}T${timeSlotMap[formData.preferredTime]}:00`;

      const appointmentData = {
        patient_id: patientInfo?.id || null,
        patient_name: formData.fullName,
        patient_phone: formData.phone,
        patient_email: formData.email,
        specialty: formData.specialty,
        scheduled_time: scheduledTime,
        appointment_type: 'consultation',
        urgency_score: triageData?.urgency_score || 50,
        notes: formData.notes,
        triage_data: triageData ? {
          symptoms: triageData.symptoms_identified,
          recommended_specialty: triageData.recommended_specialty,
          urgency_score: triageData.urgency_score
        } : null
      };

      const response = await appointmentsAPI.book(appointmentData);

      if (response.data.success) {
        // Navigate to confirmation page
        navigate(`/confirmation/${response.data.appointment.appointment_id}`, {
          state: {
            appointment: response.data.appointment,
            language
          }
        });
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.error || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          {language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment'}
        </h1>

        <div className="card">
          {triageData && (
            <div className="bg-primary-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                {language === 'hi' ? 'आपके ट्राइएज के आधार पर:' : 'Based on your triage:'}
              </h3>
              <div className="grid grid-cols-1 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">
                    {language === 'hi' ? 'अनुशंसित विशेषज्ञता:' : 'Recommended Specialty:'}
                  </span>
                  <p className="font-medium">{triageData.recommended_specialty}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'} *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder={language === 'hi' ? 'अपना नाम दर्ज करें' : 'John Doe'}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'hi' ? 'ईमेल' : 'Email'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {language === 'hi' ? 'पसंदीदा तारीख' : 'Preferred Date'} *
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                min={today}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                {language === 'hi' ? 'पसंदीदा समय' : 'Preferred Time'} *
              </label>
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="morning">
                  {language === 'hi' ? 'सुबह (9 AM - 12 PM)' : 'Morning (9 AM - 12 PM)'}
                </option>
                <option value="afternoon">
                  {language === 'hi' ? 'दोपहर (12 PM - 3 PM)' : 'Afternoon (12 PM - 3 PM)'}
                </option>
                <option value="evening">
                  {language === 'hi' ? 'शाम (3 PM - 6 PM)' : 'Evening (3 PM - 6 PM)'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'विशेषज्ञता' : 'Specialty'} *
              </label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="" disabled>
                  {language === 'hi' ? 'विशेषज्ञता चुनें' : 'Select Specialty'}
                </option>
                <option value="Orthopedics">
                  {language === 'hi' ? 'आर्थोपेडिक्स' : 'Orthopedics'}
                </option>
                <option value="General Medicine">
                  {language === 'hi' ? 'सामान्य चिकित्सा' : 'General Medicine'}
                </option>
                <option value="Cardiology">
                  {language === 'hi' ? 'हृदय रोग' : 'Cardiology'}
                </option>
                <option value="Pediatrics">
                  {language === 'hi' ? 'बाल रोग' : 'Pediatrics'}
                </option>
                <option value="Dermatology">
                  {language === 'hi' ? 'त्वचा रोग' : 'Dermatology'}
                </option>
                <option value="ENT">
                  {language === 'hi' ? 'कान, नाक, गला' : 'ENT'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'अतिरिक्त नोट्स' : 'Additional Notes'}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder={
                  language === 'hi'
                    ? 'कोई अतिरिक्त जानकारी...'
                    : 'Any additional information...'
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {language === 'hi' ? 'बुकिंग...' : 'Booking...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {language === 'hi' ? 'अपॉइंटमेंट की पुष्टि करें' : 'Confirm Appointment'}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 text-gray-600 text-sm">
          <p>
            {language === 'hi' ? 'मदद चाहिए? हमें कॉल करें' : 'Need help? Call us at'}{' '}
            <a href="tel:108" className="text-primary-600 font-semibold">108</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
