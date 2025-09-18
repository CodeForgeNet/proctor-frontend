import axios from "axios";
import { DetectionEvent, Session } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const api = {
  createSession: async (candidateName: string): Promise<Session> => {
    const response = await axios.post(`${API_URL}/sessions`, { candidateName });
    const data: any = response.data;
    return {
      id: data._id,
      candidateName: data.candidateName,
      startTime: data.startTime,
      events: data.events,
    };
  },

  logEvents: async (
    sessionId: string,
    events: DetectionEvent[]
  ): Promise<void> => {
    await axios.post(
      `${API_URL}/logs`,
      { sessionId, events },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  uploadVideo: async (sessionId: string, videoBlob: Blob): Promise<void> => {
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("video", videoBlob, "interview.webm");

    await axios.post(`${API_URL}/upload-video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getReport: async (sessionId: string): Promise<string> => {
    const response = await axios.get(`${API_URL}/report/${sessionId}`, {
      responseType: "blob",
    });
    return URL.createObjectURL(response.data);
  },

  getSessionDetails: async (sessionId: string): Promise<Session> => {
    const response = await axios.get(`${API_URL}/sessions/${sessionId}`);
    const data: any = response.data;
    return {
      id: data._id,
      candidateName: data.candidateName,
      startTime: data.startTime,
      endTime: data.endTime,
      videoUrl: data.videoUrl,
      events: data.events,
      integrityScore: data.integrityScore,
    };
  },
};
