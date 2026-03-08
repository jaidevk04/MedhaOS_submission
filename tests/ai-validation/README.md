# AI Model Validation

This directory contains validation tests for all AI models in the MedhaOS ecosystem.

## Test Structure

- `datasets/` - Test datasets for model validation
- `accuracy/` - Accuracy validation tests
- `bias/` - Bias detection tests
- `explainability/` - Model explainability tests
- `performance/` - Model inference performance tests
- `results/` - Validation results and reports

## AI Models to Validate

### 1. AI Triage Agent
- **Accuracy Target**: 92%
- **Test Dataset**: 10,000 labeled triage cases
- **Metrics**: Precision, Recall, F1-Score, AUC-ROC

### 2. Diagnostic Vision Agent
- **Accuracy Target**: 89%
- **Test Dataset**: 5,000 medical images (X-ray, CT, MRI)
- **Metrics**: Sensitivity, Specificity, Dice Score

### 3. Regional Disease Prediction Agent
- **Accuracy Target**: 89%
- **Test Dataset**: Historical outbreak data (5 years)
- **Metrics**: Precision, Recall, Lead Time

### 4. CDSS Agent
- **Accuracy Target**: 85%
- **Test Dataset**: 8,000 clinical cases with expert recommendations
- **Metrics**: Recommendation accuracy, Safety score

## Running Validation Tests

```bash
# Run all validation tests
npm run validate:all

# Run specific model validation
npm run validate:triage
npm run validate:vision
npm run validate:disease-prediction
npm run validate:cdss

# Run bias detection
npm run validate:bias

# Run explainability tests
npm run validate:explainability

# Generate validation report
npm run generate:report
```

## Validation Requirements

Based on requirements 1.4, 5.2, 11.2, 17.1:

- **Accuracy**: Models must meet minimum accuracy thresholds
- **Bias**: No significant bias across demographics (age, gender, geography)
- **Explainability**: All predictions must be explainable
- **Safety**: No unsafe recommendations
- **Performance**: Inference time within acceptable limits

## Test Datasets

Test datasets are stored in `datasets/` and include:
- Ground truth labels from medical experts
- Diverse demographics (age, gender, geography)
- Edge cases and rare conditions
- Adversarial examples

## Bias Detection

Tests for bias across:
- Age groups (pediatric, adult, geriatric)
- Gender (male, female, other)
- Geography (urban vs rural)
- Socioeconomic status
- Language preference

## Explainability Testing

Validates that models provide:
- Feature importance scores
- Decision reasoning
- Confidence scores
- Alternative recommendations

## Continuous Validation

Models are validated:
- Before deployment (pre-production)
- After deployment (production monitoring)
- Periodically (monthly validation runs)
- After retraining (model updates)
