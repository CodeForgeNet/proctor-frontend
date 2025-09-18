import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import { ObjectDetection } from "../types";

let objectModel: cocoSsd.ObjectDetection | null = null;

const SUSPICIOUS_OBJECTS = [
  "cell phone",
  "book",
  "laptop",
  "tablet",
  "remote",
  "keyboard",
];

export async function initObjectDetection(): Promise<void> {
  
  await tf.setBackend("cpu");
  objectModel = await cocoSsd.load();
  
}

export async function detectObjects(
  video: HTMLVideoElement
): Promise<ObjectDetection[]> {
  if (!objectModel) await initObjectDetection();

  try {
    const predictions = await objectModel!.detect(video);

    return predictions
      .filter(
        (pred) => SUSPICIOUS_OBJECTS.includes(pred.class) && pred.score > 0.5
      )
      .map((pred) => ({
        class: pred.class,
        score: pred.score,
        bbox: pred.bbox,
      }));
  } catch (error) {
    console.error("Object detection error:", error);
    return [];
  }
}