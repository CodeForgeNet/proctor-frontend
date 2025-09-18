import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceData } from "../types";

let faceLandmarker: FaceLandmarker | null = null;

export async function initFaceDetection(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 4,
  });
}

const euclideanDistance = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const eyeAspectRatio = (landmarks: any[], eyeIndices: number[]) => {
  const p1 = landmarks[eyeIndices[0]];
  const p2 = landmarks[eyeIndices[1]];
  const p3 = landmarks[eyeIndices[2]];
  const p4 = landmarks[eyeIndices[3]];
  const p5 = landmarks[eyeIndices[4]];
  const p6 = landmarks[eyeIndices[5]];

  const verticalDist = euclideanDistance(p2, p6) + euclideanDistance(p3, p5);
  const horizontalDist = euclideanDistance(p1, p4);

  return verticalDist / (2 * horizontalDist);
};

export async function detectFaces(
  video: HTMLVideoElement,
  timestamp: number
): Promise<FaceData> {
  if (!faceLandmarker) await initFaceDetection();

  try {
    const result = faceLandmarker!.detectForVideo(video, timestamp);
    const faces = result.faceLandmarks;

    if (faces.length === 0) {
      return {
        present: false,
        lookingAway: false,
        faceCount: 0,
        isDrowsy: false,
      };
    }

    const landmarks = faces[0];

    const leftEyeIndices = [33, 160, 158, 133, 144, 153];
    const rightEyeIndices = [362, 385, 387, 263, 373, 380];
    const leftEAR = eyeAspectRatio(landmarks, leftEyeIndices);
    const rightEAR = eyeAspectRatio(landmarks, rightEyeIndices);
    const ear = (leftEAR + rightEAR) / 2;
    const isDrowsy = ear < 0.2;

    const box = {
      originX: Math.min(...landmarks.map((l) => l.x * video.videoWidth)),
      originY: Math.min(...landmarks.map((l) => l.y * video.videoHeight)),
      width:
        Math.max(...landmarks.map((l) => l.x * video.videoWidth)) -
        Math.min(...landmarks.map((l) => l.x * video.videoWidth)),
      height:
        Math.max(...landmarks.map((l) => l.y * video.videoHeight)) -
        Math.min(...landmarks.map((l) => l.y * video.videoHeight)),
    };

    const centerX = box.originX + box.width / 2;
    const videoWidth = video.videoWidth;

    const offsetX = Math.abs(centerX / videoWidth - 0.5);
    const isLookingAway = offsetX > 0.25;

    return {
      present: true,
      lookingAway: isLookingAway,
      faceCount: faces.length,
      boundingBox: {
        x: box.originX,
        y: box.originY,
        width: box.width,
        height: box.height,
      },
      isDrowsy: isDrowsy,
    };
  } catch (error) {
    console.error("Face detection error:", error);
    return {
      present: false,
      lookingAway: false,
      faceCount: 0,
      isDrowsy: false,
    };
  }
}
