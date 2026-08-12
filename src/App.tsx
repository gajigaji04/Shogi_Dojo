import { Route, Routes } from "react-router-dom";
import { RetroHeader } from "./components/common/RetroHeader";
import { RetroFooter } from "./components/common/RetroFooter";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";
import { TutorialGamePage } from "./pages/TutorialGamePage";
import { PlayMenuPage } from "./pages/PlayMenuPage";
import { CpuGamePage } from "./pages/CpuGamePage";
import { OnlinePlayPage } from "./pages/OnlinePlayPage";
import { ReplayListPage } from "./pages/ReplayListPage";
import { ReplayViewerPage } from "./pages/ReplayViewerPage";
import { KifuImportPage } from "./pages/KifuImportPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AboutPage } from "./pages/AboutPage";
import { AboutShogiPage } from "./pages/AboutShogiPage";
import { NoticeListPage } from "./pages/NoticeListPage";
import { NoticeDetailPage } from "./pages/NoticeDetailPage";
import { ContactPage } from "./pages/ContactPage";
import { NotFoundPage } from "./pages/NotFoundPage";

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
          <Route path="/play/online" element={<OnlinePlayPage />} />
          <Route path="/replay" element={<ReplayListPage />} />
          <Route path="/replay/:id" element={<ReplayViewerPage />} />
          <Route path="/kifu" element={<KifuImportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about-shogi" element={<AboutShogiPage />} />
          <Route path="/notice" element={<NoticeListPage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <RetroFooter />
    </div>
  );
}
