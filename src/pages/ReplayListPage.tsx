import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { listGames } from "../game/storage/gameStorage";
import type { GameRecord } from "../game/storage/gameStorage";
import { useI18n } from "../i18n/I18nContext";
import styles from "./ReplayListPage.module.css";

export function ReplayListPage() {
  const { t, locale } = useI18n();
  const [games, setGames] = useState<GameRecord[]>([]);

  useEffect(() => {
    setGames(listGames());
  }, []);

  return (
    <PageContainer>
      <h1>{t("replay.title")}</h1>
      {games.length === 0 ? (
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
            {games.map((g) => {
              const won = g.winner === g.humanPlayer;
              return (
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
                      <span className={won ? styles.win : styles.loss}>{won ? t("common.wins") : t("common.loses")}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </PageContainer>
  );
}
