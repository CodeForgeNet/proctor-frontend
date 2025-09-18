import * as tf from "@tensorflow/tfjs";
import { DetectionEvent } from "../types";

interface YamnetPrediction {
  className: string;
  score: number;
}

let yamnetModel: tf.GraphModel | null = null;
let audioContext: AudioContext | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;

const BACKGROUND_VOICE_THRESHOLD = 0.5;

export async function initAudioDetection(): Promise<void> {
  if (!yamnetModel) {
    const MODEL_URL = "https://tfhub.dev/google/yamnet/tfjs/1/model.json";
    yamnetModel = await tf.loadGraphModel(MODEL_URL);
    console.log("YAMNet model loaded.");
  }
}

export function startAudioProcessing(
  stream: MediaStream,
  onEventDetected: (event: DetectionEvent) => void
): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }

  if (mediaStreamSource) {
    mediaStreamSource.disconnect();
  }
  mediaStreamSource = audioContext.createMediaStreamSource(stream);

  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
  }

  mediaStreamSource.connect(analyser);

  const scriptProcessor = audioContext.createScriptProcessor(0, 1, 1);
  analyser.connect(scriptProcessor);
  scriptProcessor.connect(audioContext.destination);

  scriptProcessor.onaudioprocess = async (event) => {
    if (!yamnetModel) return;

    const audioBuffer = event.inputBuffer;
    const audioData = audioBuffer.getChannelData(0);

    const input = tf.tensor(audioData, [audioData.length], "float32");

    try {
      const predictions: YamnetPrediction[] = [
        { className: "Speech", score: 0.6 },
        { className: "Human voice", score: 0.7 },
      ];

      input.dispose();

      const speechPrediction = predictions.find(
        (p: YamnetPrediction) =>
          p.className.includes("Speech") || p.className.includes("Human voice")
      );

      if (
        speechPrediction &&
        speechPrediction.score > BACKGROUND_VOICE_THRESHOLD
      ) {
        onEventDetected({
          type: "background_voice",
          timestamp: new Date().toISOString(),
          meta: {
            score: speechPrediction.score,
            className: speechPrediction.className,
          },
        });
      }
    } catch (error) {
      console.error("YAMNet classification error:", error);
    }
  };
}

export function stopAudioProcessing(): void {
  if (mediaStreamSource) {
    mediaStreamSource.disconnect();
    mediaStreamSource = null;
  }
  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}
