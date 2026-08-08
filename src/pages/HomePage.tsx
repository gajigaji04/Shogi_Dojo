import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RetroPanel } from "../components/common/RetroPanel";
import { ShogiBoard } from "../components/shogi/ShogiBoard";
import { createInitialBoard } from "../game/state/gameState";
import { listGames } from "../game/storage/gameStorage";
import { bumpAndGetVisitCount } from "../game/storage/visitCounter";
import { api } from "../api/client";
import { noticeTitle } from "../api/notice";
import type { Notice } from "../api/notice";
import { useI18n } from "../i18n/I18nContext";
import styles from "./HomePage.module.css";

const board = createInitialBoard();
const NEW_BADGE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function HomePage() {
  const { t, locale } = useI18n();
  const [visits, setVisits] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    setVisits(bumpAndGetVisitCount());
    setGamesPlayed(listGames().length);
    api
      .get<{ notices: Notice[] }>("/api/notices")
      .then((res) => setNotices(res.notices.slice(0, 3)))
      .catch(() => setNotices([]));
  }, []);

  return (
    <PageContainer>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>Shogi / 将棋 / 쇼기</div>
        <h1 className={styles.title}>{t("app.title")}</h1>
        <div className={styles.subtitle}>{t("app.subtitle")}</div>

        <div className={styles.boardWrap} aria-hidden="true">
          <ShogiBoard board={board} interactive={false} />
        </div>
        <div className={styles.tagline}>「{t("app.tagline")}」</div>

        <div className={styles.ctaRow}>
          <Link to="/learn">
            <RetroButton variant="primary">{t("home.ctaLearn")}</RetroButton>
          </Link>
          <Link to="/play/cpu">
            <RetroButton>{t("home.ctaCpu")}</RetroButton>
          </Link>
          <Link to="/play">
            <RetroButton>{t("home.ctaOnline")}</RetroButton>
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <RetroPanel title={t("home.newsTitle")}>
          {notices === null && <div className={styles.newsEmpty}>{t("loading.notices")}</div>}
          {notices?.length === 0 && <div className={styles.newsEmpty}>{t("notice.empty")}</div>}
          {notices && notices.length > 0 && (
            <ul className={styles.newsList}>
              {notices.map((n) => {
                const isNew = Date.now() - new Date(n.publishedAt).getTime() < NEW_BADGE_WINDOW_MS;
                return (
                  <li key={n.id}>
                    <Link to={`/notice/${n.id}`} className={styles.newsLink}>
                      <span className={styles.newsDate}>{new Date(n.publishedAt).toLocaleDateString(locale)}</span>
                      <span>
                        <span className={styles.newsTitleText}>{noticeTitle(n, locale)}</span>
                        {isNew && <span className={styles.newBadge}>NEW</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={styles.newsMore}>
            <Link to="/notice">{t("notice.title")} →</Link>
          </div>
        </RetroPanel>

        <RetroPanel title={t("home.statsTitle")}>
          <table className={styles.statsTable}>
            <tbody>
              <tr>
                <td>{t("home.statsGames")}</td>
                <td>{gamesPlayed}</td>
              </tr>
              <tr>
                <td>{t("home.statsToday")}</td>
                <td>{visits}</td>
              </tr>
            </tbody>
          </table>
        </RetroPanel>
      </div>
    </PageContainer>
  );
}
