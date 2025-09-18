import React from "react";
import { FaceData, ObjectDetection } from "../types";

interface DebugOverlayProps {
  faceData: FaceData | null;
  objects: ObjectDetection[];
  events: Array<{ type: string; timestamp: string }>;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({
  faceData,
  objects,
  events,
}) => {
  return (
    <div className="debug-overlay">
      <div className="debug-section">
        <h4>Face Detection</h4>
        <pre>{JSON.stringify(faceData, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h4>Object Detection ({objects.length})</h4>
        <pre>{JSON.stringify(objects, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h4>Recent Events</h4>
        <pre>{JSON.stringify(events.slice(-5), null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugOverlay;
