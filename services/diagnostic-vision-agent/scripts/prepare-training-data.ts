/**
 * Script to prepare synthetic medical imaging dataset for model training
 * 
 * This script generates synthetic training data for:
 * - LLaVA fine-tuning on medical images
 * - BiomedCLIP training for medical image classification
 * - MedSAM training for medical image segmentation
 */

import * as fs from 'fs';
import * as path from 'path';

interface TrainingExample {
  imageId: string;
  imagePath: string;
  modality: string;
  bodyPart: string;
  findings: string[];
  anomalies: Array<{
    type: string;
    location: string;
    severity: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  label: string;
  segmentationMask?: string;
}

class TrainingDataGenerator {
  private outputDir: string;

  constructor(outputDir: string = './training-data') {
    this.outputDir = outputDir;
    this.ensureDirectoryExists(outputDir);
  }

  /**
   * Generate synthetic training dataset
   */
  async generateDataset(numSamples: number = 1000): Promise<void> {
    console.log(`Generating ${numSamples} synthetic training examples...`);

    const examples: TrainingExample[] = [];

    for (let i = 0; i < numSamples; i++) {
      const example = this.generateExample(i);
      examples.push(example);

      if ((i + 1) % 100 === 0) {
        console.log(`Generated ${i + 1}/${numSamples} examples`);
      }
    }

    // Save dataset splits
    const trainSize = Math.floor(numSamples * 0.8);
    const valSize = Math.floor(numSamples * 0.1);

    const trainExamples = examples.slice(0, trainSize);
    const valExamples = examples.slice(trainSize, trainSize + valSize);
    const testExamples = examples.slice(trainSize + valSize);

    await this.saveDataset('train', trainExamples);
    await this.saveDataset('val', valExamples);
    await this.saveDataset('test', testExamples);

    console.log('\nDataset generation complete!');
    console.log(`Train: ${trainExamples.length} examples`);
    console.log(`Val: ${valExamples.length} examples`);
    console.log(`Test: ${testExamples.length} examples`);
  }

  /**
   * Generate a single training example
   */
  private generateExample(index: number): TrainingExample {
    const modalities = ['X-ray', 'CT', 'MRI', 'Ultrasound', 'Mammography'];
    const bodyParts = ['chest', 'abdomen', 'head', 'spine', 'extremities', 'breast'];
    
    const modality = modalities[Math.floor(Math.random() * modalities.length)];
    const bodyPart = bodyParts[Math.floor(Math.random() * bodyParts.length)];

    const hasAbnormality = Math.random() > 0.3; // 70% abnormal, 30% normal

    const example: TrainingExample = {
      imageId: `img_${index.toString().padStart(6, '0')}`,
      imagePath: `images/${modality.toLowerCase()}/${bodyPart}/${index}.jpg`,
      modality,
      bodyPart,
      findings: [],
      anomalies: [],
      label: hasAbnormality ? 'abnormal' : 'normal'
    };

    if (hasAbnormality) {
      example.findings = this.generateFindings(modality, bodyPart);
      example.anomalies = this.generateAnomalies(modality, bodyPart);
    } else {
      example.findings = [`Normal ${modality} of ${bodyPart}`, 'No acute abnormalities'];
    }

    return example;
  }

  /**
   * Generate realistic findings based on modality and body part
   */
  private generateFindings(modality: string, bodyPart: string): string[] {
    const findingsMap: Record<string, Record<string, string[]>> = {
      'X-ray': {
        'chest': [
          'Focal opacity in right lower lobe',
          'Cardiomegaly with cardiothoracic ratio > 0.5',
          'Pleural effusion on left side',
          'Pneumothorax with lung collapse',
          'Rib fracture at 5th rib'
        ],
        'extremities': [
          'Transverse fracture of distal radius',
          'Joint space narrowing consistent with osteoarthritis',
          'Soft tissue swelling',
          'Bone density appears decreased'
        ]
      },
      'CT': {
        'head': [
          'Hypodense area in left frontal lobe',
          'Midline shift of 5mm',
          'Subarachnoid hemorrhage',
          'Mass lesion with surrounding edema'
        ],
        'abdomen': [
          'Hepatic lesion measuring 3.2 cm',
          'Splenomegaly',
          'Free fluid in pelvis',
          'Bowel wall thickening'
        ]
      },
      'MRI': {
        'head': [
          'T2 hyperintense lesion in white matter',
          'Restricted diffusion in left MCA territory',
          'Mass effect with herniation',
          'Multiple demyelinating plaques'
        ],
        'spine': [
          'Disc herniation at L4-L5',
          'Spinal canal stenosis',
          'Cord compression',
          'Degenerative changes'
        ]
      }
    };

    const modalityFindings = findingsMap[modality] || {};
    const findings = modalityFindings[bodyPart] || ['Abnormal findings present'];
    
    // Return 1-3 random findings
    const numFindings = Math.floor(Math.random() * 3) + 1;
    return this.shuffleArray(findings).slice(0, numFindings);
  }

  /**
   * Generate anomalies with locations
   */
  private generateAnomalies(modality: string, bodyPart: string): any[] {
    const anomalyTypes = [
      'mass', 'lesion', 'fracture', 'hemorrhage', 'effusion',
      'pneumonia', 'tumor', 'calcification', 'inflammation'
    ];

    const severities = ['critical', 'moderate', 'minor'];
    const numAnomalies = Math.floor(Math.random() * 2) + 1;

    const anomalies = [];
    for (let i = 0; i < numAnomalies; i++) {
      anomalies.push({
        type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
        location: this.generateLocation(bodyPart),
        severity: severities[Math.floor(Math.random() * severities.length)],
        boundingBox: {
          x: Math.floor(Math.random() * 800),
          y: Math.floor(Math.random() * 800),
          width: Math.floor(Math.random() * 200) + 50,
          height: Math.floor(Math.random() * 200) + 50
        }
      });
    }

    return anomalies;
  }

  /**
   * Generate anatomical location
   */
  private generateLocation(bodyPart: string): string {
    const locations: Record<string, string[]> = {
      'chest': ['right upper lobe', 'left lower lobe', 'right middle lobe', 'left upper lobe'],
      'abdomen': ['liver', 'spleen', 'kidney', 'pancreas', 'bowel'],
      'head': ['frontal lobe', 'temporal lobe', 'parietal lobe', 'occipital lobe', 'cerebellum'],
      'spine': ['cervical', 'thoracic', 'lumbar', 'sacral'],
      'extremities': ['proximal', 'distal', 'medial', 'lateral'],
      'breast': ['upper outer quadrant', 'lower inner quadrant', 'retroareolar', 'axillary tail']
    };

    const bodyPartLocations = locations[bodyPart] || ['unspecified'];
    return bodyPartLocations[Math.floor(Math.random() * bodyPartLocations.length)];
  }

  /**
   * Save dataset to JSON file
   */
  private async saveDataset(split: string, examples: TrainingExample[]): Promise<void> {
    const filePath = path.join(this.outputDir, `${split}.json`);
    fs.writeFileSync(filePath, JSON.stringify(examples, null, 2));
    console.log(`Saved ${split} dataset to ${filePath}`);
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Run the script
async function main() {
  const generator = new TrainingDataGenerator('./training-data');
  
  // Generate 10,000 synthetic examples
  await generator.generateDataset(10000);
}

main().catch(console.error);
