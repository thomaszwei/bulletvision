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

export default function App() {
  return (
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
  );
}
