import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { listGames } from "../game/storage/gameStorage";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import styles from "./ReplayListPage.module.css";

interface Row {
  id: string;
  date: string;
  opponentLabel: string;
  won: boolean | null;
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

export function ReplayListPage() {
  const { t, locale } = useI18n();
  const { status } = useAuth();
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

  return (
    <PageContainer>
      <h1>{t("replay.title")}</h1>
      {rows.length === 0 ? (
        <div className={styles.empty}>{t("replay.noGames")}</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("replay.date")}</th>
              <th>{t("replay.opponent")}</th>
              <th>{t("replay.result")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id}>
                <td>
                  <Link className={styles.link} to={`/replay/${g.id}`}>
                    {new Date(g.date).toLocaleDateString(locale)}
                  </Link>
                </td>
                <td>
                  <Link className={styles.link} to={`/replay/${g.id}`}>
                    {g.opponentLabel}
                  </Link>
                </td>
                <td>
                  <Link className={styles.link} to={`/replay/${g.id}`}>
                    <span className={g.won ? styles.win : styles.loss}>
                      {g.won ? t("common.wins") : t("common.loses")}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageContainer>
  );
}
