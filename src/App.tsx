import { Route, Routes } from "react-router-dom";
import { RetroHeader } from "./components/common/RetroHeader";
import { RetroFooter } from "./components/common/RetroFooter";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";
import { TutorialGamePage } from "./pages/TutorialGamePage";
import { PlayMenuPage } from "./pages/PlayMenuPage";
import { CpuGamePage } from "./pages/CpuGamePage";
import { ReplayListPage } from "./pages/ReplayListPage";
import { ReplayViewerPage } from "./pages/ReplayViewerPage";
import { ProfilePage } from "./pages/ProfilePage";

export default function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <RetroHeader />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/tutorial" element={<TutorialGamePage />} />
          <Route path="/play" element={<PlayMenuPage />} />
          <Route path="/play/cpu" element={<CpuGamePage />} />
          <Route path="/replay" element={<ReplayListPage />} />
          <Route path="/replay/:id" element={<ReplayViewerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      <RetroFooter />
    </div>
  );
}
