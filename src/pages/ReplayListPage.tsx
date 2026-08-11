import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { listGames } from "../game/storage/gameStorage";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import styles from "./ReplayListPage.module.css";

type Result = "win" | "loss" | "draw";

interface Row {
  id: string;
  date: string;
  opponentLabel: string;
  result: Result;
}

function resultOf(winner: "sente" | "gote" | null | undefined, humanPlayer: "sente" | "gote"): Result {
  if (!winner) return "draw";
  return winner === humanPlayer ? "win" : "loss";
}

interface MineGamesResponse {
  games: {
    id: string;
    startedAt: string;
    opponent: string;
    humanPlayer: "sente" | "gote";
    winner: "sente" | "gote" | null;
    status: string;
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
      result: resultOf(g.winner, g.humanPlayer),
    }));

    if (status !== "authenticated") {
      setRows(local);
      return;
    }

    api
      .get<MineGamesResponse>("/api/games/mine")
      .then((res) => {
        const online: Row[] = res.games
          .filter((g) => g.status === "FINISHED" || g.status === "ABANDONED")
          .map((g) => ({
            id: g.id,
            date: g.startedAt,
            opponentLabel: g.opponent,
            result: resultOf(g.winner, g.humanPlayer),
          }));
        setRows([...local, ...online].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      })
      .catch(() => setRows(local));
  }, [status]);

  const resultClass: Record<Result, string> = { win: styles.win, loss: styles.loss, draw: styles.draw };
  const resultLabel: Record<Result, string> = { win: t("common.wins"), loss: t("common.loses"), draw: t("game.drawn") };

  return (
    <PageContainer>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>{t("replay.title")}</h1>
        <Link to="/kifu">
          <RetroButton size="small">{t("kifu.title")}</RetroButton>
        </Link>
      </div>
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
                    <span className={resultClass[g.result]}>{resultLabel[g.result]}</span>
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
