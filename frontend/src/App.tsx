import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import Dashboard from "@/pages/Dashboard";
import LiveSession from "@/pages/LiveSession";
import Players from "@/pages/Players";
import Highscores from "@/pages/Highscores";
import SessionHistory from "@/pages/SessionHistory";
import Settings from "@/pages/Settings";
import Calibration from "@/pages/Calibration";
import Help from "@/pages/Help";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-8">
          <div className="card max-w-lg text-center space-y-4">
            <h1 className="text-2xl font-bold text-accent">Something went wrong</h1>
            <p className="text-gray-400 text-sm font-mono break-all">{this.state.error.message}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<PageLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="session" element={<LiveSession />} />
            <Route path="session/:id" element={<LiveSession />} />
            <Route path="players" element={<Players />} />
            <Route path="highscores" element={<Highscores />} />
            <Route path="history" element={<SessionHistory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calibration" element={<Calibration />} />
            <Route path="help" element={<Help />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
