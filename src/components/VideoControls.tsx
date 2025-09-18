import React from "react";
import "../styles/VideoControls.css";

interface VideoControlsProps {
  recording: boolean;
  onToggleRecording: () => void;
  onEndSession?: () => void;
  disabled?: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  recording,
  onToggleRecording,
  onEndSession,
  disabled = false,
}) => {
  return (
    <div className="video-controls">
      <button
        onClick={onToggleRecording}
        className={`record-button ${recording ? "recording" : ""}`}
        disabled={disabled}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {recording && onEndSession && (
        <button
          onClick={onEndSession}
          className="end-session-button"
          disabled={disabled}
        >
          End Session
        </button>
      )}

      <div className={`status-indicator ${recording ? "recording" : ""}`}>
        {recording ? "Recording in progress" : "Ready to record"}
      </div>
    </div>
  );
};

export default VideoControls;
