import { Question, QuestionOption } from '../types';

/**
 * Questionnaire Engine Service
 * Manages structured medical questionnaires for triage
 */
export class QuestionnaireService {
  private questions: Map<string, Question>;

  constructor() {
    this.questions = new Map();
    this.initializeQuestions();
  }

  /**
   * Initialize the question bank with structured medical questions
   */
  private initializeQuestions(): void {
    const questionBank: Question[] = [
      // Initial Symptom Questions
      {
        id: 'q1_chief_complaint',
        text: 'What is your main concern or symptom today?',
        type: 'text',
        required: true,
        category: 'symptom',
      },
      {
        id: 'q2_symptom_onset',
        text: 'When did your symptoms start?',
        type: 'single_choice',
        required: true,
        category: 'symptom',
        options: [
          { value: 'just_now', label: 'Just now (within last hour)', severity: 9 },
          { value: '2_6_hours', label: '2-6 hours ago', severity: 8 },
          { value: '6_24_hours', label: '6-24 hours ago', severity: 7 },
          { value: '1_3_days', label: '1-3 days ago', severity: 5 },
          { value: '3_7_days', label: '3-7 days ago', severity: 4 },
          { value: 'over_week', label: 'More than a week ago', severity: 3 },
        ],
      },
      {
        id: 'q3_symptom_severity',
        text: 'How would you rate the severity of your symptoms?',
        type: 'single_choice',
        required: true,
        category: 'symptom',
        options: [
          { value: 'mild', label: 'Mild - Barely noticeable', severity: 2 },
          { value: 'moderate', label: 'Moderate - Uncomfortable but manageable', severity: 5 },
          { value: 'severe', label: 'Severe - Significantly affecting daily activities', severity: 8 },
          { value: 'unbearable', label: 'Unbearable - Cannot function normally', severity: 10 },
        ],
      },

      // Chest Pain Specific Questions
      {
        id: 'q4_chest_pain_character',
        text: 'How would you describe the chest pain?',
        type: 'single_choice',
        required: true,
        category: 'symptom',
        condition: {
          dependsOn: 'q1_chief_complaint',
          expectedAnswer: ['chest pain', 'chest discomfort', 'heart pain'],
        },
        options: [
          { value: 'sharp', label: 'Sharp or stabbing', severity: 7 },
          { value: 'pressure', label: 'Pressure or squeezing', severity: 9 },
          { value: 'burning', label: 'Burning sensation', severity: 6 },
          { value: 'dull', label: 'Dull ache', severity: 5 },
        ],
      },
      {
        id: 'q5_chest_pain_radiation',
        text: 'Does the pain spread to other areas?',
        type: 'multiple_choice',
        required: false,
        category: 'symptom',
        condition: {
          dependsOn: 'q1_chief_complaint',
          expectedAnswer: ['chest pain', 'chest discomfort', 'heart pain'],
        },
        options: [
          { value: 'left_arm', label: 'Left arm', severity: 9 },
          { value: 'right_arm', label: 'Right arm', severity: 7 },
          { value: 'jaw', label: 'Jaw or neck', severity: 9 },
          { value: 'back', label: 'Back', severity: 7 },
          { value: 'none', label: 'No radiation', severity: 5 },
        ],
      },
      {
        id: 'q6_chest_pain_associated',
        text: 'Are you experiencing any of these symptoms along with chest pain?',
        type: 'multiple_choice',
        required: false,
        category: 'symptom',
        condition: {
          dependsOn: 'q1_chief_complaint',
          expectedAnswer: ['chest pain', 'chest discomfort', 'heart pain'],
        },
        options: [
          { value: 'sweating', label: 'Sweating', severity: 9 },
          { value: 'nausea', label: 'Nausea or vomiting', severity: 8 },
          { value: 'shortness_breath', label: 'Shortness of breath', severity: 9 },
          { value: 'dizziness', label: 'Dizziness or lightheadedness', severity: 8 },
          { value: 'palpitations', label: 'Heart palpitations', severity: 7 },
          { value: 'none', label: 'None of these', severity: 5 },
        ],
      },

      // Respiratory Symptoms
      {
        id: 'q7_breathing_difficulty',
        text: 'Are you having difficulty breathing?',
        type: 'single_choice',
        required: true,
        category: 'symptom',
        options: [
          { value: 'severe', label: 'Yes, severe difficulty', severity: 10 },
          { value: 'moderate', label: 'Yes, moderate difficulty', severity: 7 },
          { value: 'mild', label: 'Yes, mild difficulty', severity: 5 },
          { value: 'none', label: 'No difficulty', severity: 2 },
        ],
      },
      {
        id: 'q8_cough',
        text: 'Do you have a cough?',
        type: 'single_choice',
        required: false,
        category: 'symptom',
        options: [
          { value: 'dry', label: 'Yes, dry cough', severity: 4 },
          { value: 'productive', label: 'Yes, cough with phlegm', severity: 5 },
          { value: 'blood', label: 'Yes, coughing up blood', severity: 10 },
          { value: 'none', label: 'No cough', severity: 1 },
        ],
      },

      // Fever and Infection
      {
        id: 'q9_fever',
        text: 'Do you have a fever?',
        type: 'single_choice',
        required: true,
        category: 'symptom',
        options: [
          { value: 'high', label: 'Yes, high fever (>103°F/39.4°C)', severity: 8 },
          { value: 'moderate', label: 'Yes, moderate fever (100-103°F)', severity: 5 },
          { value: 'low', label: 'Yes, low-grade fever (<100°F)', severity: 3 },
          { value: 'none', label: 'No fever', severity: 1 },
        ],
      },

      // Neurological Symptoms
      {
        id: 'q10_consciousness',
        text: 'Are you experiencing any changes in consciousness or alertness?',
        type: 'single_choice',
        required: true,
        category: 'symptom',
        options: [
          { value: 'confused', label: 'Yes, confused or disoriented', severity: 10 },
          { value: 'drowsy', label: 'Yes, unusually drowsy', severity: 8 },
          { value: 'alert', label: 'No, fully alert', severity: 1 },
        ],
      },
      {
        id: 'q11_headache',
        text: 'Do you have a headache?',
        type: 'single_choice',
        required: false,
        category: 'symptom',
        options: [
          { value: 'worst_ever', label: 'Yes, worst headache of my life', severity: 10 },
          { value: 'severe', label: 'Yes, severe headache', severity: 7 },
          { value: 'moderate', label: 'Yes, moderate headache', severity: 4 },
          { value: 'mild', label: 'Yes, mild headache', severity: 2 },
          { value: 'none', label: 'No headache', severity: 1 },
        ],
      },

      // Abdominal Symptoms
      {
        id: 'q12_abdominal_pain',
        text: 'Do you have abdominal pain?',
        type: 'single_choice',
        required: false,
        category: 'symptom',
        options: [
          { value: 'severe', label: 'Yes, severe pain', severity: 8 },
          { value: 'moderate', label: 'Yes, moderate pain', severity: 5 },
          { value: 'mild', label: 'Yes, mild pain', severity: 3 },
          { value: 'none', label: 'No pain', severity: 1 },
        ],
      },

      // Medical History Questions
      {
        id: 'q13_chronic_conditions',
        text: 'Do you have any chronic medical conditions?',
        type: 'multiple_choice',
        required: true,
        category: 'history',
        options: [
          { value: 'heart_disease', label: 'Heart disease', severity: 8 },
          { value: 'diabetes', label: 'Diabetes', severity: 6 },
          { value: 'hypertension', label: 'High blood pressure', severity: 6 },
          { value: 'asthma', label: 'Asthma or COPD', severity: 7 },
          { value: 'kidney_disease', label: 'Kidney disease', severity: 7 },
          { value: 'cancer', label: 'Cancer', severity: 8 },
          { value: 'immunocompromised', label: 'Weakened immune system', severity: 8 },
          { value: 'none', label: 'None', severity: 1 },
        ],
      },
      {
        id: 'q14_recent_surgery',
        text: 'Have you had any surgery in the past 30 days?',
        type: 'boolean',
        required: true,
        category: 'history',
      },
      {
        id: 'q15_current_medications',
        text: 'Are you currently taking any medications?',
        type: 'boolean',
        required: true,
        category: 'history',
      },

      // Demographics and Risk Factors
      {
        id: 'q16_age',
        text: 'What is your age?',
        type: 'numeric',
        required: true,
        category: 'demographics',
      },
      {
        id: 'q17_pregnancy',
        text: 'Are you currently pregnant?',
        type: 'boolean',
        required: false,
        category: 'demographics',
      },
    ];

    // Store questions in map for quick access
    questionBank.forEach(q => this.questions.set(q.id, q));
  }

  /**
   * Get the first question for a new triage session
   */
  getFirstQuestion(): Question {
    return this.questions.get('q1_chief_complaint')!;
  }

  /**
   * Get a specific question by ID
   */
  getQuestion(questionId: string): Question | undefined {
    return this.questions.get(questionId);
  }

  /**
   * Determine the next question based on current responses
   */
  getNextQuestion(
    currentQuestionId: string,
    answer: string | string[],
    allResponses: Map<string, string | string[]>
  ): Question | null {
    const currentQuestion = this.questions.get(currentQuestionId);
    if (!currentQuestion) return null;

    // Check if there are follow-up questions
    if (currentQuestion.followUpQuestions && currentQuestion.followUpQuestions.length > 0) {
      for (const followUpId of currentQuestion.followUpQuestions) {
        const followUpQuestion = this.questions.get(followUpId);
        if (followUpQuestion && !allResponses.has(followUpId)) {
          return followUpQuestion;
        }
      }
    }

    // Get next question in sequence based on logic
    const nextQuestionId = this.determineNextQuestionId(currentQuestionId, answer, allResponses);
    if (nextQuestionId) {
      return this.questions.get(nextQuestionId) || null;
    }

    return null;
  }

  /**
   * Determine next question ID based on branching logic
   */
  private determineNextQuestionId(
    currentQuestionId: string,
    answer: string | string[],
    allResponses: Map<string, string | string[]>
  ): string | null {
    // Extract question number
    const currentNum = parseInt(currentQuestionId.split('_')[0].substring(1));
    
    // Check for conditional questions
    const chiefComplaint = allResponses.get('q1_chief_complaint');
    const isChestPain = typeof chiefComplaint === 'string' && 
      chiefComplaint.toLowerCase().includes('chest');

    // Branching logic
    if (currentQuestionId === 'q3_symptom_severity') {
      if (isChestPain) {
        return 'q4_chest_pain_character';
      }
      return 'q7_breathing_difficulty';
    }

    if (currentQuestionId === 'q6_chest_pain_associated') {
      return 'q7_breathing_difficulty';
    }

    // Default sequential progression
    for (let i = currentNum + 1; i <= 17; i++) {
      const nextId = Array.from(this.questions.keys()).find(id => 
        id.startsWith(`q${i}_`)
      );
      
      if (nextId) {
        const nextQuestion = this.questions.get(nextId);
        if (nextQuestion) {
          // Check if question has conditions
          if (nextQuestion.condition) {
            const dependsOnAnswer = allResponses.get(nextQuestion.condition.dependsOn);
            const expectedAnswers = Array.isArray(nextQuestion.condition.expectedAnswer)
              ? nextQuestion.condition.expectedAnswer
              : [nextQuestion.condition.expectedAnswer];
            
            // Check if condition is met
            if (dependsOnAnswer) {
              const answerStr = typeof dependsOnAnswer === 'string' 
                ? dependsOnAnswer.toLowerCase()
                : dependsOnAnswer.join(' ').toLowerCase();
              
              const conditionMet = expectedAnswers.some(expected => 
                answerStr.includes(expected.toLowerCase())
              );
              
              if (!conditionMet) {
                continue; // Skip this question
              }
            }
          }
          
          // Check if already answered
          if (!allResponses.has(nextId)) {
            return nextId;
          }
        }
      }
    }

    return null; // No more questions
  }

  /**
   * Validate an answer for a specific question
   */
  validateAnswer(questionId: string, answer: string | string[]): boolean {
    const question = this.questions.get(questionId);
    if (!question) return false;

    // Check required
    if (question.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
      return false;
    }

    // Type-specific validation
    switch (question.type) {
      case 'single_choice':
        if (typeof answer !== 'string') return false;
        return question.options?.some(opt => opt.value === answer) || false;
      
      case 'multiple_choice':
        if (!Array.isArray(answer)) return false;
        return answer.every(a => question.options?.some(opt => opt.value === a));
      
      case 'boolean':
        return typeof answer === 'string' && ['true', 'false', 'yes', 'no'].includes(answer.toLowerCase());
      
      case 'numeric':
        return typeof answer === 'string' && !isNaN(Number(answer));
      
      case 'text':
        return typeof answer === 'string' && answer.trim().length > 0;
      
      default:
        return true;
    }
  }

  /**
   * Get all questions (for admin/testing purposes)
   */
  getAllQuestions(): Question[] {
    return Array.from(this.questions.values());
  }
}
