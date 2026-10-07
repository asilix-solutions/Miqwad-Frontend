/* eslint no-undef: "error", no-unused-vars: "error" */
/* global AudioWorkletProcessor, registerProcessor */

// Transfer small batches of mono PCM16. The output stays silent: no microphone monitoring.
class VoiceCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.active = false;
    this.done = false;
    this.buffer = new ArrayBuffer(8192);
    this.view = new DataView(this.buffer);
    this.frames = 0;
    this.port.onmessage = ({ data }) => {
      if (data === "start") this.active = true;
      if (data === "stop") {
        this.active = false;
        this.done = true;
        this.flush();
        this.port.postMessage({ type: "stopped" });
      }
    };
  }

  flush() {
    if (!this.frames) return;
    const pcm = this.buffer.slice(0, this.frames * 2);
    this.port.postMessage({ type: "chunk", pcm }, [pcm]);
    this.frames = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (this.active && channel) {
      for (const value of channel) {
        const sample = Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
        this.view.setInt16(this.frames * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
        if (++this.frames === 4096) this.flush();
      }
    }
    return !this.done;
  }
}

registerProcessor("chat-voice-capture", VoiceCaptureProcessor);
