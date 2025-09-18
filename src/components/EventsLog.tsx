import React from "react";
import { DetectionEvent } from "../types";
import "../styles/EventsLog.css";

interface EventsLogProps {
  events: DetectionEvent[];
  maxEvents?: number;
}

const EventsLog: React.FC<EventsLogProps> = ({ events, maxEvents = 10 }) => {
  const recentEvents = events.slice(-maxEvents);

  return (
    <div className="events-log">
      <h3>Detection Events</h3>
      {recentEvents.length === 0 ? (
        <p className="no-events">No events detected yet</p>
      ) : (
        <ul>
          {recentEvents.map((event, index) => (
            <li key={index} className={`event-${event.type}`}>
              {new Date(event.timestamp).toLocaleTimeString()}: {event.type}
              {event.durationMs && ` (${Math.round(event.durationMs / 1000)}s)`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventsLog;
