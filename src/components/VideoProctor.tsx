import React, { useRef, useState, useEffect } from "react";
import { runDetection, resetDetectionState } from "../services/detection";
import { initFaceDetection } from "../services/faceProcessing";
import { initObjectDetection } from "../services/objectDetection";
import { api } from "../services/api";
import { DetectionEvent, FaceData, ObjectDetection, Session } from "../types";
import io from "socket.io-client";
import "../styles/VideoProctor.css";

interface VideoProctorProps {
  candidateName: string;
  onSessionComplete: (reportUrl: string) => void;
}

export const VideoProctor: React.FC<VideoProctorProps> = ({
  candidateName,
  onSessionComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);
  const [session, setSession] = useState<Session | null>(null);
  const [recording, setRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const socketRef = useRef<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingRef = useRef(recording);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  const [currentFaceData, setCurrentFaceData] = useState<FaceData | null>(null);
  const [currentObjects, setCurrentObjects] = useState<ObjectDetection[]>([]);

  useEffect(() => {
    if (!candidateName || initialized.current) {
      return;
    }
    initialized.current = true;

    async function initialize() {
      console.log("VideoProctor: Starting initialization...");
      try {
        console.log("VideoProctor: Initializing ML models...");
        await Promise.all([initFaceDetection(), initObjectDetection()]);
        console.log("VideoProctor: ML models initialized.");

        console.log("VideoProctor: Creating session...");
        const newSessionResponse = await api.createSession(candidateName);
        console.log("VideoProctor: Session created.");
        
        const sessionObj = {
          id:
            typeof newSessionResponse === "string"
              ? newSessionResponse
              : newSessionResponse.id,
          candidateName,
          startTime: new Date().toISOString(),
          events: [],
        };
        setSession(sessionObj);
        console.log("VideoProctor: Session state set.");

        console.log("VideoProctor: Initializing socket...");
        const SOCKET_URL =
          process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";
        const socket = io(SOCKET_URL);
        socket.on("connect", () => {
          console.log("VideoProctor: Socket connected.");
          socket.emit("join-session", { sessionId: sessionObj.id });
        });
        socketRef.current = socket;
        console.log("VideoProctor: Socket initialized.");

        console.log("VideoProctor: Initialization complete. Setting isLoading to false.");
        setIsLoading(false);
      } catch (error) {
        console.error("VideoProctor: Initialization error:", error);
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      resetDetectionState();
    };
  }, [candidateName]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let stream: MediaStream;

    async function setupCamera() {
      if (videoRef.current) {
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (err) {
          console.error("VideoProctor: Error accessing media devices:", err);
          if (err instanceof DOMException) {
            console.error(`DOMException: ${err.name} - ${err.message}`);
          }
          return;
        }
        

        videoRef.current.srcObject = stream;

        try {
          await videoRef.current.play();
        } catch (err) {
          console.error("VideoProctor: Error playing video:", err);
        }

        const options = { mimeType: "video/webm; codecs=vp9" };
        const mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current = mediaRecorder;

        videoRef.current.onloadedmetadata = () => {
          
          videoRef.current?.play();
          
        };
      } else {
        
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLoading]);

  useEffect(() => {
    let animationFrameId: number;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 200;

    const detectLoop = async (timestamp: number) => {
      if (!session || isLoading) {
        animationFrameId = requestAnimationFrame(detectLoop);
        return;
      }

      if (timestamp - lastDetectionTime >= DETECTION_INTERVAL_MS) {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const result = await runDetection(videoRef.current);

          setCurrentFaceData(result.faceData);
          setCurrentObjects(result.objects);

          if (result.events.length > 0) {
            setEvents((prev) => [...prev, ...result.events]);
            await api.logEvents(session.id, result.events);

            if (socketRef.current) {
              result.events.forEach((event) => {
                socketRef.current?.emit("proctor-event", {
                  sessionId: session.id,
                  type: event.type,
                  timestamp: event.timestamp,
                  meta: event.meta,
                });
              });
            }
          }

          drawOverlay(result.faceData, result.objects);

          lastDetectionTime = timestamp;
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    animationFrameId = requestAnimationFrame(detectLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [session, isLoading]);

  const drawOverlay = (faceData: FaceData, objects: ObjectDetection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceData.present && faceData.boundingBox) {
      const { x, y, width, height } = faceData.boundingBox;

      ctx.strokeStyle = faceData.lookingAway ? "red" : "green";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = faceData.lookingAway ? "red" : "green";
      ctx.font = "16px Arial";
      ctx.fillText(
        faceData.lookingAway ? "Looking Away!" : "Focused",
        x,
        y - 5
      );
    }

    objects.forEach((obj) => {
      const [x, y, width, height] = obj.bbox;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "red";
      ctx.font = "16px Arial";
      ctx.fillText(`${obj.class} (${Math.round(obj.score * 100)}%)`, x, y - 5);
    });
  };

  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      setTimeout(async () => {
        if (session && recordedChunksRef.current.length > 0) {
          const videoBlob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });

          try {
            
            await api.uploadVideo(session.id, videoBlob);
            const reportUrl = await api.getReport(session.id);
            onSessionComplete(reportUrl);
          } catch (error) {
            console.error("Error uploading video:", error);
          }
        }
      }, 1000);
    } else {
      recordedChunksRef.current = [];
      mediaRecorderRef.current.start(1000);
      setRecording(true);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Loading video and ML models...</div>
      </div>
    );
  }

  const handleCopy = () => {
    if (session) {
      navigator.clipboard.writeText(session.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="video-proctor">
      {session && (
        <div className="session-info">
          <p>
            Session ID: <code>{session.id}</code>
          </p>
          <button onClick={handleCopy} className="copy-button">
            {isCopied ? "Copied!" : "Copy ID"}
          </button>
        </div>
      )}
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "auto" }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      <div className="proctoring-status">
        <div className={`status-indicator ${recording ? "recording" : ""}`}>
          {recording ? "Recording in progress" : "Ready to record"}
        </div>
        <div className="detection-info">
          <div className="face-status">
            Face:{" "}
            {currentFaceData?.present
              ? currentFaceData.lookingAway
                ? "Looking Away"
                : "Focused"
              : "Not Detected"}
          </div>
          <div className="object-status">
            Objects Detected: {currentObjects.length}
          </div>
        </div>
      </div>

      <div className="controls">
        <button
          onClick={toggleRecording}
          className={`record-button ${recording ? "recording" : ""}`}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>

      <div className="events-log">
        <h3>Detection Events</h3>
        <ul>
          {events.slice(-10).map((event, index) => (
            <li key={index} className={`event-${event.type}`}>
              {new Date(event.timestamp).toLocaleTimeString()}: {event.type}
              {event.durationMs && ` (${Math.round(event.durationMs / 1000)}s)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};