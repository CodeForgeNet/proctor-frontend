export interface DetectionEvent {
  type:
    | "looking_away"
    | "user_absent"
    | "multiple_faces"
    | "suspicious_object"
    | "drowsiness_detected"
    | "background_voice";
  timestamp: string;
  durationMs?: number;
  meta?: any;
}

export interface Session {
  id: string;
  candidateName: string;
  startTime: string;
  endTime?: string;
  videoUrl?: string;
  events: DetectionEvent[];
  integrityScore?: number;
}

export interface FaceData {
  present: boolean;
  lookingAway: boolean;
  faceCount: number;
  isDrowsy: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ObjectDetection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}
