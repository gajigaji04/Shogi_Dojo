import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { listGames } from "../game/storage/gameStorage";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import styles from "./ProfilePage.module.css";

interface Row {
  id: string;
  date: string;
  opponentLabel: string;
  won: boolean;
}

interface MineGamesResponse {
  games: {
    id: string;
    startedAt: string;
    opponent: string;
    humanPlayer: "sente" | "gote";
    winner: "sente" | "gote" | null;
  }[];
}

export function ProfilePage() {
  const { t, locale } = useI18n();
  const { user, status } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const local: Row[] = listGames().map((g) => ({
      id: g.id,
      date: g.date,
      opponentLabel: g.opponentLabel,
      won: g.winner === g.humanPlayer,
    }));

    if (status !== "authenticated") {
      setRows(local);
      return;
    }

    api
      .get<MineGamesResponse>("/api/games/mine")
      .then((res) => {
        const online: Row[] = res.games
          .filter((g) => g.winner !== null)
          .map((g) => ({
            id: g.id,
            date: g.startedAt,
            opponentLabel: g.opponent,
            won: g.winner === g.humanPlayer,
          }));
        setRows([...local, ...online].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      })
      .catch(() => setRows(local));
  }, [status]);

  const wins = rows.filter((g) => g.won).length;
  const losses = rows.length - wins;
  const winRate = rows.length > 0 ? Math.round((wins / rows.length) * 100) : 0;

  return (
    <PageContainer>
      <div className={styles.banner}>
        <div className={styles.bannerTitle}>{t("profile.title")}</div>
        {user && <div style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-small)", color: "var(--ink-700)" }}>{t("auth.welcomeBack", { nickname: user.nickname })}</div>}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <div className={styles.statValue}>{rows.length}</div>
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
      {rows.length === 0 ? (
        <p style={{ color: "var(--ink-500)" }}>{t("profile.noRecentGames")}</p>
      ) : (
        <ul className={styles.list}>
          {rows.slice(0, 15).map((g) => (
            <li key={g.id}>
              <Link to={`/replay/${g.id}`} className={styles.row}>
                <span>{new Date(g.date).toLocaleDateString(locale)}</span>
                <span>
                  {t("common.vs")} {g.opponentLabel}
                </span>
                <span className={g.won ? styles.win : styles.loss}>{g.won ? t("common.wins") : t("common.loses")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
