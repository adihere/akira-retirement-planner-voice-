/**
 * AudioRecorder - Captures microphone audio and converts to base64 PCM16
 * 
 * Improvements:
 * - Added AudioContext.resume() for mobile browser compatibility
 * - Proper error handling with typed errors
 * - Graceful cleanup on stop/error
 */
export class AudioRecorder {
  stream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  processor: ScriptProcessorNode | null = null;
  onData: (base64: string) => void;
  private isStarted: boolean = false;

  constructor(onData: (base64: string) => void) {
    this.onData = onData;
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      console.warn('[AudioRecorder] Already started, ignoring duplicate start call');
      return;
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Resume AudioContext for mobile browser compatibility (autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Note: ScriptProcessorNode is deprecated but AudioWorklet requires
      // serving a separate JS file which complicates deployment.
      // For now, we continue using ScriptProcessorNode with proper error handling.
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isStarted) return;
        
        try {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          const buffer = new ArrayBuffer(pcm16.length * 2);
          const view = new DataView(buffer);
          pcm16.forEach((b, i) => view.setInt16(i * 2, b, true));
          
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          this.onData(btoa(binary));
        } catch (err) {
          console.error('[AudioRecorder] Error processing audio:', err);
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isStarted = true;
      
    } catch (err) {
      // Clean up any partial state
      this.cleanup();
      
      // Re-throw with more context
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Microphone permission denied. Please allow microphone access and try again.');
        } else if (err.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (err.name === 'NotReadableError') {
          throw new Error('Microphone is in use by another application. Please close other apps using the microphone.');
        }
      }
      throw err;
    }
  }

  private cleanup(): void {
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) { /* ignore */ }
      this.processor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) { /* ignore */ }
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) { /* ignore */ }
      this.audioContext = null;
    }
  }

  stop(): void {
    this.isStarted = false;
    this.cleanup();
  }
}

/**
 * AudioStreamer - Plays PCM16 audio chunks from Gemini's response
 * 
 * Improvements:
 * - Added AudioContext.resume() for mobile browser compatibility
 * - Better state management
 * - Graceful error handling
 */
export class AudioStreamer {
  audioContext: AudioContext;
  nextStartTime: number = 0;
  sources: AudioBufferSourceNode[] = [];
  private isStopped: boolean = false;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  async ensureResumed(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  addPCM16(base64: string): void {
    if (this.isStopped || this.audioContext.state === 'closed') return;

    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }
      source.start(this.nextStartTime);
      this.sources.push(source);
      
      source.onended = () => {
        this.sources = this.sources.filter(s => s !== source);
      };

      this.nextStartTime += audioBuffer.duration;
    } catch (err) {
      console.error('[AudioStreamer] Error playing audio:', err);
    }
  }

  stop(): void {
    this.isStopped = true;
    this.interrupt();
    if (this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) { /* ignore */ }
    }
  }
  
  interrupt(): void {
    this.sources.forEach(source => {
      try { 
        source.stop(); 
      } catch (e) { /* ignore - may already be stopped */ }
    });
    this.sources = [];
    if (this.audioContext.state !== 'closed') {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }
}
