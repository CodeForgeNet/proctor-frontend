import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { DetectionEvent } from "../types";
import { api } from "../services/api";
import "../styles/InterviewerPage.css";

const InterviewerPage: React.FC = () => {
  const [sessionId, setSessionId] = useState("");
  const [alerts, setAlerts] = useState<DetectionEvent[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const socketRef = useRef<any | null>(null);

  useEffect(() => {
    if (sessionId) {
      const fetchHistoricalEvents = async () => {
        try {
          const sessionDetails = await api.getSessionDetails(sessionId);
          setAlerts(sessionDetails.events);
          setVideoUrl(sessionDetails.videoUrl || null);
        } catch (error) {
          console.error("Error fetching historical events:", error);
          setAlerts([]);
          setVideoUrl(null);
        }
      };

      fetchHistoricalEvents();

      const SOCKET_URL =
        process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";
      socketRef.current = io(SOCKET_URL);

      const currentSocket = socketRef.current;

      currentSocket.on("connect", () => {
        console.log("Socket connected for interviewer");
        currentSocket.emit("join-session", { sessionId });
      });

      currentSocket.on("proctor-event", (data: DetectionEvent) => {
        setAlerts((prevAlerts) => [...prevAlerts, data]);
      });

      return () => {
        if (currentSocket) {
          currentSocket.off("proctor-event");
          currentSocket.disconnect();
        }
      };
    }
  }, [sessionId]);

  const handleSessionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionId(e.target.value);
  };

  return (
    <div className="interviewer-page">
      <h2>Interviewer View</h2>
      <input
        type="text"
        value={sessionId}
        onChange={handleSessionIdChange}
        placeholder="Enter Session ID"
      />
      {videoUrl && (
        <div className="video-player-container">
          <h3>Recorded Video</h3>
          <video controls src={videoUrl} className="recorded-video"></video>
        </div>
      )}
      <h3>Proctoring Alerts</h3>
      <ul className="alerts-list">
        {alerts.map((alert, index) => (
          <li key={index} className={`alert alert-${alert.type}`}>
            {new Date(alert.timestamp).toLocaleTimeString()}: {alert.type}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InterviewerPage;
