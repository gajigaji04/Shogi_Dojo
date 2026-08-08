import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { listGames } from "../game/storage/gameStorage";
import type { GameRecord } from "../game/storage/gameStorage";
import { useI18n } from "../i18n/I18nContext";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const { t, locale } = useI18n();
  const [games, setGames] = useState<GameRecord[]>([]);

  useEffect(() => {
    setGames(listGames());
  }, []);

  const wins = games.filter((g) => g.winner === g.humanPlayer).length;
  const losses = games.length - wins;
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;

  return (
    <PageContainer>
      <div className={styles.banner}>
        <div className={styles.bannerTitle}>{t("profile.title")}</div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <div className={styles.statValue}>{games.length}</div>
          <div className={styles.statLabel}>{t("common.total")}</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statValue}>{wins}</div>
          <div className={styles.statLabel}>{t("common.wins")}</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statValue}>{losses}</div>
          <div className={styles.statLabel}>{t("common.loses")}</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statValue}>{winRate}%</div>
          <div className={styles.statLabel}>{t("common.winRate")}</div>
        </div>
      </div>

      <div className={styles.divider}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <h2>{t("profile.recentGames")}</h2>
      {games.length === 0 ? (
        <p style={{ color: "var(--ink-500)" }}>{t("profile.noRecentGames")}</p>
      ) : (
        <ul className={styles.list}>
          {games.slice(0, 15).map((g) => {
            const won = g.winner === g.humanPlayer;
            return (
              <li key={g.id}>
                <Link to={`/replay/${g.id}`} className={styles.row}>
                  <span>{new Date(g.date).toLocaleDateString(locale)}</span>
                  <span>{t("common.vs")} {g.opponentLabel}</span>
                  <span className={won ? styles.win : styles.loss}>{won ? t("common.wins") : t("common.loses")}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
