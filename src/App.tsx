import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { VideoProctor } from "./components/VideoProctor";
import InterviewerPage from "./components/InterviewerPage";
import "./App.css";

function App() {
  const [candidateName, setCandidateName] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName.trim()) {
      setSessionStarted(true);
    }
  };

  const handleSessionComplete = (url: string) => {
    setReportUrl(url);
    setSessionStarted(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Interview Proctoring System</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/interviewer">Interviewer</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {!sessionStarted && !reportUrl && (
                  <div className="start-form">
                    <h2>Start New Interview Session</h2>
                    <form onSubmit={handleStartSession}>
                      <div className="form-group">
                        <label htmlFor="candidateName">Candidate Name:</label>
                        <input
                          type="text"
                          id="candidateName"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit">Start Session</button>
                    </form>
                  </div>
                )}

                {sessionStarted && (
                  <VideoProctor
                    candidateName={candidateName}
                    onSessionComplete={handleSessionComplete}
                  />
                )}

                {reportUrl && (
                  <div className="report-section">
                    <h2>Session Complete</h2>
                    <p>Thank you for completing your interview session.</p>
                    <a
                      href={reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="report-button"
                    >
                      View Proctoring Report
                    </a>
                    <button
                      onClick={() => {
                        setReportUrl(null);
                        setCandidateName("");
                      }}
                    >
                      Start New Session
                    </button>
                  </div>
                )}
              </>
            }
          />
          <Route path="/interviewer" element={<InterviewerPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
