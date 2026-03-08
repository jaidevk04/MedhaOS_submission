/**
 * Voice Activity Detection (VAD) Service
 * Detects speech presence in audio streams
 */
export class VoiceActivityDetectionService {
  private readonly energyThreshold: number;
  private readonly zeroCrossingThreshold: number;
  private readonly minSpeechDuration: number; // milliseconds
  private readonly minSilenceDuration: number; // milliseconds

  constructor(options?: {
    energyThreshold?: number;
    zeroCrossingThreshold?: number;
    minSpeechDuration?: number;
    minSilenceDuration?: number;
  }) {
    this.energyThreshold = options?.energyThreshold ?? 0.02;
    this.zeroCrossingThreshold = options?.zeroCrossingThreshold ?? 0.3;
    this.minSpeechDuration = options?.minSpeechDuration ?? 300;
    this.minSilenceDuration = options?.minSilenceDuration ?? 500;
  }

  /**
   * Detect voice activity in audio buffer
   */
  detectVoiceActivity(audioBuffer: Buffer, sampleRate: number = 16000): {
    isSpeech: boolean;
    confidence: number;
    energy: number;
    zeroCrossingRate: number;
  } {
    // Convert buffer to samples (assuming 16-bit PCM)
    const samples = this.bufferToSamples(audioBuffer);

    // Calculate energy
    const energy = this.calculateEnergy(samples);

    // Calculate zero-crossing rate
    const zeroCrossingRate = this.calculateZeroCrossingRate(samples);

    // Determine if speech is present
    const isSpeech = energy > this.energyThreshold && zeroCrossingRate < this.zeroCrossingThreshold;

    // Calculate confidence based on how far from thresholds
    const energyConfidence = Math.min(energy / this.energyThreshold, 1);
    const zcrConfidence = Math.min(
      (this.zeroCrossingThreshold - zeroCrossingRate) / this.zeroCrossingThreshold,
      1
    );
    const confidence = (energyConfidence + zcrConfidence) / 2;

    return {
      isSpeech,
      confidence: Math.max(0, Math.min(1, confidence)),
      energy,
      zeroCrossingRate,
    };
  }

  /**
   * Detect speech segments in audio
   */
  detectSpeechSegments(
    audioBuffer: Buffer,
    sampleRate: number = 16000
  ): Array<{
    startTime: number;
    endTime: number;
    duration: number;
  }> {
    const samples = this.bufferToSamples(audioBuffer);
    const frameSize = Math.floor(sampleRate * 0.02); // 20ms frames
    const frameCount = Math.floor(samples.length / frameSize);

    const segments: Array<{
      startTime: number;
      endTime: number;
      duration: number;
    }> = [];

    let inSpeech = false;
    let speechStartFrame = 0;

    for (let i = 0; i < frameCount; i++) {
      const frameStart = i * frameSize;
      const frameEnd = Math.min(frameStart + frameSize, samples.length);
      const frame = samples.slice(frameStart, frameEnd);

      const energy = this.calculateEnergy(frame);
      const zcr = this.calculateZeroCrossingRate(frame);
      const isSpeech = energy > this.energyThreshold && zcr < this.zeroCrossingThreshold;

      if (isSpeech && !inSpeech) {
        // Speech started
        speechStartFrame = i;
        inSpeech = true;
      } else if (!isSpeech && inSpeech) {
        // Speech ended
        const startTime = (speechStartFrame * frameSize) / sampleRate;
        const endTime = (i * frameSize) / sampleRate;
        const duration = endTime - startTime;

        // Only add if duration is above minimum
        if (duration * 1000 >= this.minSpeechDuration) {
          segments.push({
            startTime,
            endTime,
            duration,
          });
        }

        inSpeech = false;
      }
    }

    // Handle case where speech continues to end of audio
    if (inSpeech) {
      const startTime = (speechStartFrame * frameSize) / sampleRate;
      const endTime = samples.length / sampleRate;
      const duration = endTime - startTime;

      if (duration * 1000 >= this.minSpeechDuration) {
        segments.push({
          startTime,
          endTime,
          duration,
        });
      }
    }

    return segments;
  }

  /**
   * Calculate audio energy (RMS)
   */
  private calculateEnergy(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Calculate zero-crossing rate
   */
  private calculateZeroCrossingRate(samples: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / samples.length;
  }

  /**
   * Convert buffer to normalized float samples
   */
  private bufferToSamples(buffer: Buffer): Float32Array {
    const samples = new Float32Array(buffer.length / 2);
    for (let i = 0; i < samples.length; i++) {
      // Read 16-bit signed integer
      const sample = buffer.readInt16LE(i * 2);
      // Normalize to [-1, 1]
      samples[i] = sample / 32768.0;
    }
    return samples;
  }

  /**
   * Get waveform data for visualization
   */
  getWaveformData(
    audioBuffer: Buffer,
    targetPoints: number = 100
  ): {
    points: number[];
    min: number;
    max: number;
  } {
    const samples = this.bufferToSamples(audioBuffer);
    const samplesPerPoint = Math.floor(samples.length / targetPoints);
    const points: number[] = [];

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < targetPoints; i++) {
      const start = i * samplesPerPoint;
      const end = Math.min(start + samplesPerPoint, samples.length);

      // Calculate RMS for this segment
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += samples[j] * samples[j];
      }
      const rms = Math.sqrt(sum / (end - start));

      points.push(rms);
      min = Math.min(min, rms);
      max = Math.max(max, rms);
    }

    return { points, min, max };
  }

  /**
   * Detect silence periods
   */
  detectSilence(
    audioBuffer: Buffer,
    sampleRate: number = 16000
  ): Array<{
    startTime: number;
    endTime: number;
    duration: number;
  }> {
    const samples = this.bufferToSamples(audioBuffer);
    const frameSize = Math.floor(sampleRate * 0.02); // 20ms frames
    const frameCount = Math.floor(samples.length / frameSize);

    const silences: Array<{
      startTime: number;
      endTime: number;
      duration: number;
    }> = [];

    let inSilence = false;
    let silenceStartFrame = 0;

    for (let i = 0; i < frameCount; i++) {
      const frameStart = i * frameSize;
      const frameEnd = Math.min(frameStart + frameSize, samples.length);
      const frame = samples.slice(frameStart, frameEnd);

      const energy = this.calculateEnergy(frame);
      const isSilence = energy <= this.energyThreshold;

      if (isSilence && !inSilence) {
        // Silence started
        silenceStartFrame = i;
        inSilence = true;
      } else if (!isSilence && inSilence) {
        // Silence ended
        const startTime = (silenceStartFrame * frameSize) / sampleRate;
        const endTime = (i * frameSize) / sampleRate;
        const duration = endTime - startTime;

        // Only add if duration is above minimum
        if (duration * 1000 >= this.minSilenceDuration) {
          silences.push({
            startTime,
            endTime,
            duration,
          });
        }

        inSilence = false;
      }
    }

    return silences;
  }

  /**
   * Calculate signal-to-noise ratio
   */
  calculateSNR(audioBuffer: Buffer): number {
    const samples = this.bufferToSamples(audioBuffer);

    // Calculate signal power (RMS of entire signal)
    const signalPower = this.calculateEnergy(samples);

    // Estimate noise power (RMS of quietest 10% of frames)
    const frameSize = 512;
    const frameCount = Math.floor(samples.length / frameSize);
    const frameEnergies: number[] = [];

    for (let i = 0; i < frameCount; i++) {
      const start = i * frameSize;
      const end = Math.min(start + frameSize, samples.length);
      const frame = samples.slice(start, end);
      frameEnergies.push(this.calculateEnergy(frame));
    }

    frameEnergies.sort((a, b) => a - b);
    const noiseFrameCount = Math.max(1, Math.floor(frameCount * 0.1));
    const noisePower =
      frameEnergies.slice(0, noiseFrameCount).reduce((sum, e) => sum + e, 0) / noiseFrameCount;

    // Calculate SNR in dB
    if (noisePower === 0) return Infinity;
    return 20 * Math.log10(signalPower / noisePower);
  }
}
