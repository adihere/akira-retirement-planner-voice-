export class AudioRecorder {
  stream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  processor: ScriptProcessorNode | null = null;
  onData: (base64: string) => void;

  constructor(onData: (base64: string) => void) {
    this.onData = onData;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
          channelCount: 1,
          sampleRate: 16000,
      } });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
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
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      throw err;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class AudioStreamer {
  audioContext: AudioContext;
  nextStartTime: number = 0;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  addPCM16(base64: string) {
    if (this.audioContext.state === 'closed') return;
    
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
    this.nextStartTime += audioBuffer.duration;
  }

  stop() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
  
  interrupt() {
     if (this.audioContext.state !== 'closed') {
         this.audioContext.close();
     }
     this.audioContext = new AudioContext({ sampleRate: 24000 });
     this.nextStartTime = 0;
  }
}
