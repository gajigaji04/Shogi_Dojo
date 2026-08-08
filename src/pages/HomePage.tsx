import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RetroPanel } from "../components/common/RetroPanel";
import { ShogiBoard } from "../components/shogi/ShogiBoard";
import { createInitialBoard } from "../game/state/gameState";
import { listGames } from "../game/storage/gameStorage";
import { bumpAndGetVisitCount } from "../game/storage/visitCounter";
import { useI18n } from "../i18n/I18nContext";
import styles from "./HomePage.module.css";

const board = createInitialBoard();

export function HomePage() {
  const { t } = useI18n();
  const [visits, setVisits] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    setVisits(bumpAndGetVisitCount());
    setGamesPlayed(listGames().length);
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
          <ul className={styles.newsList}>
            <li>
              <span className={styles.newsDate}>2026.08.08</span>
              <span>
                {t("home.newsItem1")}
                <span className={styles.newBadge}>NEW</span>
              </span>
            </li>
            <li>
              <span className={styles.newsDate}>2026.08.01</span>
              <span>{t("home.newsItem2")}</span>
            </li>
          </ul>
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
