/**
 * Lightweight client-side audio DSP — pure functions operating on raw PCM
 * samples from the Web Audio API's AnalyserNode. No dependency needed for
 * either: pitch uses a standard autocorrelation algorithm (ACF2+), volume
 * is plain RMS. Sampled periodically by use-speech-session.ts to feed
 * src/lib/speech-metrics.ts's vocal-variety scoring.
 */

/** Below this RMS, a frame is treated as silence/background noise rather
 * than speech — used to gate both pitch detection and clarity sampling so
 * neither averages in meaningless readings from dead air. */
export const SILENCE_RMS_THRESHOLD = 0.01;

export function computeRms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/**
 * Returns the estimated fundamental frequency in Hz, or 0 if the signal is
 * too quiet/unvoiced to get a confident reading (silence, breath noise).
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;

  const rms = computeRms(buffer);
  if (rms < SILENCE_RMS_THRESHOLD) return 0;

  // Trim leading/trailing near-silence so autocorrelation isn't thrown off
  // by padding at the edges of the buffer.
  const threshold = 0.2;
  let start = 0;
  let end = size - 1;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) >= threshold) {
      start = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) >= threshold) {
      end = size - i;
      break;
    }
  }
  const trimmed = buffer.subarray(start, end);
  const n = trimmed.length;
  if (n < 8) return 0;

  const correlations = new Float32Array(n);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += trimmed[i] * trimmed[i + lag];
    correlations[lag] = sum;
  }

  // Skip the initial downward slope from lag 0 (which is always the max)
  // to find the first genuine peak.
  let d = 0;
  while (d < n - 1 && correlations[d] > correlations[d + 1]) d++;

  let maxValue = -1;
  let maxLag = -1;
  for (let lag = d; lag < n; lag++) {
    if (correlations[lag] > maxValue) {
      maxValue = correlations[lag];
      maxLag = lag;
    }
  }
  if (maxLag <= 0) return 0;

  // Parabolic interpolation around the peak for sub-sample precision.
  const x1 = correlations[maxLag - 1] ?? correlations[maxLag];
  const x2 = correlations[maxLag];
  const x3 = correlations[maxLag + 1] ?? correlations[maxLag];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const refinedLag = a !== 0 ? maxLag - b / (2 * a) : maxLag;

  const frequency = sampleRate / refinedLag;
  // Human voice fundamental frequency realistically falls in this range;
  // anything outside is almost certainly a tracking error, not real pitch.
  if (frequency < 60 || frequency > 500) return 0;
  return frequency;
}

/** Consonant/articulation ("presence") frequency band in Hz — standard
 * audio-engineering range where crisp consonants (s, t, k, p) live.
 * Mumbled speech loses energy here even when overall volume is normal. */
const CLARITY_BAND_LOW_HZ = 2000;
const CLARITY_BAND_HIGH_HZ = 8000;
/** Lower bound of the full band clarity is measured as a fraction of —
 * excludes sub-bass/rumble that isn't speech content. */
const FULL_BAND_LOW_HZ = 300;

/**
 * Returns the fraction (0-1) of spectral energy in the 2-8kHz "presence"
 * band relative to the 300Hz-8kHz speech band, from an AnalyserNode's
 * frequency-domain data (in dB). A real acoustic measurement of every
 * frame — no fallback constant, unlike speech-to-text confidence values
 * (which browsers frequently just don't populate). Returns 0 if there's no
 * measurable energy in the band at all (e.g. silence).
 */
export function computeSpectralClarity(
  frequencyDataDb: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binHz = sampleRate / fftSize;
  let presenceEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < frequencyDataDb.length; i++) {
    const hz = i * binHz;
    if (hz < FULL_BAND_LOW_HZ || hz > CLARITY_BAND_HIGH_HZ) continue;
    // dB is power-scale (dBFS); convert back to linear power for summing.
    const power = Math.pow(10, frequencyDataDb[i] / 10);
    totalEnergy += power;
    if (hz >= CLARITY_BAND_LOW_HZ) presenceEnergy += power;
  }

  if (totalEnergy === 0) return 0;
  return presenceEnergy / totalEnergy;
}
