# MedhaOS Clinician Terminal User Manual

## Welcome, Doctor! 👨‍⚕️

The MedhaOS Clinician Terminal is designed to enhance your clinical workflow with AI-powered tools that save time, reduce errors, and improve patient care. This manual will guide you through all features.

**Version:** 1.0.0  
**Last Updated:** February 26, 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Patient Queue Management](#patient-queue-management)
4. [AI-Synthesized Patient Brief](#ai-synthesized-patient-brief)
5. [Ambient Scribe](#ambient-scribe)
6. [Clinical Decision Support](#clinical-decision-support)
7. [Prescription Assistant](#prescription-assistant)
8. [Diagnostic Ordering](#diagnostic-ordering)
9. [Documentation](#documentation)
10. [Settings & Preferences](#settings--preferences)

---

## Getting Started

### System Requirements

**Minimum:**
- Windows 10 / macOS 10.15 / Linux Ubuntu 20.04
- 8GB RAM
- Chrome 90+ / Firefox 88+ / Safari 14+
- Stable internet connection (5 Mbps)

**Recommended:**
- 16GB RAM
- Dual monitors
- Headset with microphone (for Ambient Scribe)
- Webcam (for telemedicine)

### Login

1. Navigate to https://clinician.medhaos.health
2. Enter your credentials:
   - Email: your.email@hospital.com
   - Password: Your secure password
3. Complete MFA (if enabled):
   - Enter 6-digit code from authenticator app
4. Select your facility and department

### First-Time Setup

1. **Complete Your Profile:**
   - Specialty
   - License number (NMC registration)
   - Consultation hours
   - Languages spoken

2. **Configure Preferences:**
   - Default prescription templates
   - Favorite diagnostic tests
   - Notification settings
   - Ambient Scribe preferences

3. **Review Tutorial:**
   - Watch 5-minute onboarding video
   - Complete interactive walkthrough

---

## Dashboard Overview

### Main Layout

The Clinician Terminal uses a three-column layout:

**Left Column (30%):** AI-Synthesized Patient Brief
- Patient demographics
- Urgency score
- Medical history
- Current medications
- Allergies
- Recent vitals
- Recent diagnostics

**Center Column (50%):** Active Workspace
- Ambient Scribe (during consultation)
- Clinical notes
- Prescription entry
- Diagnostic orders

**Right Column (20%):** CDSS Recommendations
- Risk alerts
- Action items
- Diagnostic suggestions
- Treatment recommendations

### Top Navigation Bar

- **Queue Icon:** View patient queue (shows count)
- **Emergency Alert:** Critical patient notifications
- **Messages:** Secure messaging with colleagues
- **Notifications:** System alerts and reminders
- **Profile:** Your account settings

---

## Patient Queue Management

### View Your Queue

1. Click "Queue" icon in top navigation
2. See all patients assigned to you:
   - Queue position
   - Patient name and age
   - Urgency score (color-coded)
   - Chief complaint
   - Estimated time
   - Wait duration

### Queue Filters

Filter patients by:
- **Urgency:** Critical, High, Moderate, Low
- **Type:** New, Follow-up, Emergency
- **Status:** Waiting, In Progress, Completed

### Select Next Patient

1. Click on patient card in queue
2. Or click "Next Patient" button
3. Patient brief loads automatically
4. Ambient Scribe starts (if enabled)

### Reorder Queue

Manually adjust queue order:
1. Drag and drop patient cards
2. System respects clinical urgency
3. Patients notified of changes

### Emergency Alerts

Critical patients appear with red banner:
- **STEMI Alert:** Suspected heart attack
- **Sepsis Alert:** Suspected sepsis
- **Stroke Alert:** Suspected stroke
- **Trauma Alert:** Major trauma

Click "Accept" to prioritize immediately.

---

## AI-Synthesized Patient Brief

### Overview

The AI automatically compiles a comprehensive patient summary from:
- Triage data
- ABHA health records
- Previous encounters
- Lab results
- Imaging reports

### Key Sections

**1. Demographics**
- Name, age, gender
- ABHA ID
- Contact information
- Preferred language

**2. Urgency Assessment**
- Score (0-100) with color indicator
- AI reasoning
- Risk flags
- Recommended specialty

**3. Chief Complaint**
- Patient's description
- Symptom onset
- Severity rating
- Associated symptoms

**4. Medical History**
- Chronic conditions
- Previous surgeries
- Hospitalizations
- Family history

**5. Allergies** (Highlighted in Red)
- Drug allergies
- Food allergies
- Severity
- Reaction type

**6. Current Medications**
- Drug name and dosage
- Frequency
- Start date
- Prescribing doctor

**7. Recent Vitals**
- Blood pressure
- Heart rate
- Temperature
- SpO2
- Respiratory rate
- Abnormal values flagged

**8. Recent Diagnostics**
- Lab results
- Imaging reports
- ECG findings
- Quick view links

### Expand Sections

- Click any section to expand details
- View full history
- Access original reports
- See trend charts

---

## Ambient Scribe

### What is Ambient Scribe?

AI-powered real-time documentation that listens to your consultation and automatically generates clinical notes.

### Enable Ambient Scribe

**Automatic (Recommended):**
- Starts when you select a patient
- Microphone icon shows recording status

**Manual:**
- Click microphone icon to start/stop
- Red indicator shows active recording

### During Consultation

**Real-Time Transcription:**
- See conversation as you speak
- Speaker labels (Doctor/Patient)
- Bilingual display (if patient speaks Hindi, etc.)
- Edit on-the-fly

**AI-Extracted Facts:**
- Symptoms automatically identified
- Medications mentioned
- Diagnoses discussed
- Procedures planned
- Follow-up instructions

**SOAP Note Generation:**
- Auto-generated as you speak
- Structured format:
  - **S**ubjective: Patient's description
  - **O**bjective: Your findings
  - **A**ssessment: Diagnosis
  - **P**lan: Treatment plan

### Review and Edit

1. **Review AI-Generated Notes:**
   - Check accuracy
   - Add missing details
   - Correct errors

2. **Edit Sections:**
   - Click any section to edit
   - Use voice or keyboard
   - Changes saved automatically

3. **Approve and Populate EHR:**
   - Click "Auto-populate EHR"
   - Notes transferred to patient record
   - Timestamp and signature added

### Best Practices

✅ **Do:**
- Speak clearly and at normal pace
- Mention key clinical terms
- Review notes before finalizing
- Correct any errors

❌ **Don't:**
- Discuss unrelated topics
- Speak too fast
- Skip review step
- Ignore patient privacy

### Privacy & Consent

- Patient consent obtained automatically
- Recording encrypted in transit
- Audio deleted after transcription
- Only text notes retained

---

## Clinical Decision Support (CDSS)

### Real-Time Alerts

CDSS analyzes patient data and provides:

**Risk Alerts:**
- **Critical (Red):** Immediate action required
  - Example: "Possible STEMI - Troponin I STAT"
- **Warning (Yellow):** Attention needed
  - Example: "HbA1c 9.2% - Consider insulin"
- **Info (Blue):** Helpful information
  - Example: "Patient due for flu vaccine"

### Action Items

Prioritized checklist of recommended actions:
1. Order Troponin I (STAT)
2. Repeat ECG in 15 minutes
3. Administer Aspirin 300mg
4. Cardiology consult

**Accept All:** Implement all recommendations
**Modify:** Adjust individual items
**Dismiss:** Ignore with reason

### Diagnostic Recommendations

AI suggests relevant tests based on:
- Symptoms
- Physical findings
- Medical history
- Current medications

Example:
- Chest pain → ECG, Troponin, Chest X-ray
- Fever + cough → CBC, CRP, Chest X-ray

### Treatment Suggestions

Evidence-based treatment options:
- First-line medications
- Dosing guidelines
- Duration
- Monitoring parameters
- Alternative options

### Clinical Guidelines

Access to:
- NMC guidelines
- ICMR protocols
- International guidelines (AHA, ESC, etc.)
- Hospital-specific protocols

### Differential Diagnosis

AI-generated list of possible diagnoses:
- Ranked by probability
- Supporting evidence
- Ruling out criteria
- Recommended tests

---

## Prescription Assistant

### Drug Search

1. **Type Drug Name:**
   - Autocomplete suggestions
   - Generic and brand names
   - Common misspellings handled

2. **Select Drug:**
   - View drug information
   - Indications
   - Contraindications
   - Dosing guidelines

### Real-Time Safety Checks

As you add medications, system checks:

**✅ Drug Interactions:**
- No interactions detected
- Safe to prescribe

**⚠️ Moderate Interaction:**
- Warning displayed
- Clinical significance explained
- Monitoring recommendations

**🔴 Severe Interaction:**
- Prescription blocked
- Detailed explanation
- Alternative suggestions

**✅ Allergy Check:**
- Cross-referenced with patient allergies
- Includes drug class allergies

**✅ Dosage Validation:**
- Age-appropriate
- Weight-based (if applicable)
- Renal/hepatic adjustment
- Maximum daily dose

**💊 Stock Availability:**
- In-stock: Green checkmark
- Low stock: Yellow warning
- Out of stock: Red X with alternatives

### Add to Prescription

1. **Enter Dosage:**
   - Strength (e.g., 75mg)
   - Form (tablet, capsule, syrup)

2. **Set Frequency:**
   - Once daily (OD)
   - Twice daily (BD)
   - Three times daily (TDS)
   - Four times daily (QID)
   - As needed (PRN)
   - Custom schedule

3. **Duration:**
   - Days (e.g., 7 days)
   - Weeks (e.g., 2 weeks)
   - Months (e.g., 3 months)
   - Ongoing

4. **Instructions:**
   - Before/after food
   - Time of day
   - Special instructions
   - Available in patient's language

### Review Prescription

**Current Prescription Panel:**
- All medications listed
- Dosing summary
- Total cost estimate
- Insurance coverage status

**Actions:**
- Edit individual items
- Remove medications
- Add more drugs
- Save as template

### Finalize Prescription

1. **Review Safety Checks:**
   - All green checkmarks
   - Resolve any warnings

2. **Add Pharmacy Instructions:**
   - Substitution allowed/not allowed
   - Refills (if applicable)

3. **Send Prescription:**
   - **To Patient App:** Instant delivery
   - **To Pharmacy:** Direct transmission
   - **Print:** Physical copy
   - **Email:** PDF to patient

---

## Diagnostic Ordering

### Order Tests

1. **Search for Test:**
   - Type test name
   - Browse by category:
     - Laboratory (Blood, Urine, etc.)
     - Radiology (X-ray, CT, MRI, Ultrasound)
     - Cardiology (ECG, Echo, Stress test)
     - Other (Biopsy, Endoscopy, etc.)

2. **Select Test:**
   - View test details
   - Preparation instructions
   - Expected turnaround time
   - Cost

3. **Set Urgency:**
   - **STAT:** Immediate (< 1 hour)
   - **Urgent:** Same day
   - **Routine:** 24-48 hours

4. **Add Clinical Information:**
   - Indication
   - Relevant history
   - Specific instructions

5. **Submit Order:**
   - Sent to lab/radiology
   - Patient notified
   - Tracking number generated

### Track Orders

**Pending Orders:**
- Test name
- Ordered date/time
- Status (Ordered, In Progress, Completed)
- Expected completion

**View Results:**
- Notification when ready
- AI analysis (for imaging)
- Abnormal values flagged
- Trend comparison

---

## Documentation

### Clinical Notes

**SOAP Format:**
```
Subjective:
- Chief complaint
- History of present illness
- Review of systems

Objective:
- Vital signs
- Physical examination
- Lab/imaging findings

Assessment:
- Diagnosis (ICD-10 codes)
- Differential diagnosis

Plan:
- Medications prescribed
- Tests ordered
- Follow-up instructions
- Patient education
```

### Templates

**Use Templates:**
1. Click "Templates"
2. Select condition-specific template
3. Auto-fills common sections
4. Customize as needed

**Create Templates:**
1. Write note as usual
2. Click "Save as Template"
3. Name template
4. Available for future use

### Voice Dictation

**Manual Dictation:**
1. Click microphone icon
2. Speak your notes
3. AI transcribes in real-time
4. Edit as needed

### Coding Assistance

**ICD-10 Coding:**
- AI suggests codes based on diagnosis
- Search by condition name
- Recent codes saved

**CPT Coding:**
- Procedure codes auto-suggested
- Billing optimization
- Insurance requirements checked

---

## Settings & Preferences

### Profile Settings

- Update personal information
- Change password
- Configure MFA
- Set consultation hours

### Notification Preferences

- Emergency alerts
- Lab results
- Patient messages
- System updates

### Ambient Scribe Settings

- Auto-start on patient selection
- Language preferences
- Transcription accuracy level
- Speaker identification sensitivity

### Prescription Templates

- Save favorite medications
- Create condition-specific templates
- Set default instructions

### Display Preferences

- Theme (Light/Dark)
- Font size
- Column widths
- Default views

---

## Keyboard Shortcuts

Speed up your workflow:

| Action | Shortcut |
|--------|----------|
| Next Patient | `Ctrl + N` |
| Start/Stop Ambient Scribe | `Ctrl + M` |
| New Prescription | `Ctrl + P` |
| Order Test | `Ctrl + T` |
| Save Notes | `Ctrl + S` |
| Search Drug | `Ctrl + D` |
| View Queue | `Ctrl + Q` |
| Emergency Alert | `Ctrl + E` |

---

## Troubleshooting

### Ambient Scribe Not Working

**Check:**
- Microphone permissions enabled
- Microphone not muted
- Good internet connection
- Browser updated

**Solution:**
- Refresh page
- Check browser settings
- Try different browser
- Contact support

### Prescription Not Sending

**Check:**
- All required fields filled
- Safety checks passed
- Patient has app installed
- Internet connection

**Solution:**
- Review error message
- Resolve safety warnings
- Print as backup
- Contact support

### Slow Performance

**Solutions:**
- Close unused tabs
- Clear browser cache
- Check internet speed
- Restart browser

---

## Best Practices

### Efficiency Tips

1. **Use Keyboard Shortcuts:** Save time
2. **Create Templates:** For common conditions
3. **Review AI Suggestions:** Don't ignore CDSS
4. **Keep Notes Concise:** Focus on key points
5. **Use Ambient Scribe:** Reduce typing

### Clinical Safety

1. **Always Review AI Output:** Don't blindly accept
2. **Check Allergies:** Before prescribing
3. **Verify Drug Interactions:** Critical for safety
4. **Document Thoroughly:** For medicolegal protection
5. **Follow Guidelines:** Use evidence-based medicine

### Patient Communication

1. **Explain Diagnosis:** In simple terms
2. **Discuss Treatment Options:** Shared decision-making
3. **Provide Written Instructions:** Via app
4. **Schedule Follow-up:** Don't forget
5. **Encourage Questions:** Patient engagement

---

## Support

### Help Resources

**In-App Help:**
- Click "?" icon
- Search help articles
- Watch video tutorials

**Live Support:**
- Chat: Click chat icon (bottom right)
- Email: clinician-support@medhaos.health
- Phone: 1800-XXX-XXXX (24/7)

**Training:**
- Monthly webinars
- On-site training available
- Certification program

---

## Frequently Asked Questions

**Q: Is patient data secure?**
A: Yes, we use 256-bit encryption, ABDM compliance, and regular security audits.

**Q: Can I use the system offline?**
A: Limited functionality available offline. Full features require internet.

**Q: How accurate is the AI?**
A: Triage: 92%, Vision: 89%, Coding: 92%. Always verify AI recommendations.

**Q: Can I customize the interface?**
A: Yes, adjust layout, theme, and preferences in Settings.

**Q: What if I disagree with AI recommendations?**
A: You have full control. Dismiss or modify any AI suggestion with clinical reasoning.

---

## Thank You! 🙏

Thank you for using MedhaOS Clinician Terminal. We're committed to supporting you in delivering excellent patient care.

**For feedback or suggestions:**
feedback@medhaos.health

---

**Version:** 1.0.0  
**Last Updated:** February 26, 2026  
**© 2026 MedhaOS Healthcare Intelligence Pvt. Ltd.**
