import "@tensorflow/tfjs-backend-webgl";
import { detectFaces } from "./faceProcessing";
import { detectObjects } from "./objectDetection";
import { DetectionEvent, FaceData, ObjectDetection } from "../types";

let absentStart: number | null = null;
let lookingAwayStart: number | null = null;
let drowsinessStart: number | null = null;
let lastEventTypes: Record<string, number> = {};

const LOOKING_AWAY_THRESHOLD_MS = 5000;
const ABSENT_THRESHOLD_MS = 10000;
const DROWSINESS_THRESHOLD_MS = 3000;
const EVENT_COOLDOWN_MS = 15000;

export async function runDetection(video: HTMLVideoElement): Promise<{
  events: DetectionEvent[];
  faceData: FaceData;
  objects: ObjectDetection[];
}> {
  const events: DetectionEvent[] = [];
  const now = Date.now();

  const faceData = await detectFaces(video, now);

  if (!faceData.present) {
    if (!absentStart) absentStart = now;
    if (now - absentStart > ABSENT_THRESHOLD_MS) {
      const event = createEvent("user_absent", now - absentStart);
      if (event) events.push(event);
    }
  } else {
    absentStart = null;
  }

  if (faceData.present && faceData.lookingAway) {
    if (!lookingAwayStart) lookingAwayStart = now;
    if (now - lookingAwayStart > LOOKING_AWAY_THRESHOLD_MS) {
      const event = createEvent("looking_away", now - lookingAwayStart);
      if (event) events.push(event);
    }
  } else {
    lookingAwayStart = null;
  }

  if (faceData.present && faceData.isDrowsy) {
    if (!drowsinessStart) drowsinessStart = now;
    if (now - drowsinessStart > DROWSINESS_THRESHOLD_MS) {
      const event = createEvent("drowsiness_detected", now - drowsinessStart);
      if (event) events.push(event);
    }
  } else {
    drowsinessStart = null;
  }

  if (faceData.faceCount > 1) {
    const event = createEvent("multiple_faces");
    if (event) {
      event.meta = { count: faceData.faceCount };
      events.push(event);
    }
  }

  const objects = await detectObjects(video);

  objects.forEach((obj) => {
    const event = createEvent("suspicious_object");
    if (event) {
      event.meta = {
        class: obj.class,
        score: obj.score,
        bbox: obj.bbox,
      };
      events.push(event);
    }
  });

  return { events, faceData, objects };
}

function createEvent(
  type: DetectionEvent["type"],
  durationMs?: number
): DetectionEvent | null {
  const now = Date.now();

  if (lastEventTypes[type] && now - lastEventTypes[type] < EVENT_COOLDOWN_MS) {
    return null;
  }

  lastEventTypes[type] = now;

  return {
    type,
    timestamp: new Date().toISOString(),
    durationMs,
    meta: {},
  };
}

export function resetDetectionState(): void {
  absentStart = null;
  lookingAwayStart = null;
  drowsinessStart = null;
  lastEventTypes = {};
}
