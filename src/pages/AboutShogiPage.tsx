import { PageContainer } from "../components/common/PageContainer";
import { ShogiBoard } from "../components/shogi/ShogiBoard";
import { createInitialBoard } from "../game/state/gameState";
import { useI18n } from "../i18n/I18nContext";
import styles from "./AboutShogiPage.module.css";

const board = createInitialBoard();
const RULE_COUNT = 5;

export function AboutShogiPage() {
  const { t } = useI18n();

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("aboutShogi.title")}</h1>

      <div className={styles.section}>
        <h2>{t("aboutShogi.whatTitle")}</h2>
        <p>{t("aboutShogi.whatBody")}</p>
      </div>

      <div className={styles.boardWrap} aria-hidden="true">
        <ShogiBoard board={board} interactive={false} />
      </div>

      <div className={styles.divider}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <div className={styles.section}>
        <h2>{t("aboutShogi.historyTitle")}</h2>
        <p>{t("aboutShogi.historyBody")}</p>
      </div>

      <div className={styles.divider}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <div className={styles.section}>
        <h2>{t("aboutShogi.boardTitle")}</h2>
        <p>{t("aboutShogi.boardBody")}</p>
      </div>

      <div className={styles.divider}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <div className={styles.section}>
        <h2>{t("aboutShogi.uniqueTitle")}</h2>
        <ul className={styles.ruleList}>
          {Array.from({ length: RULE_COUNT }, (_, i) => (
            <li key={i}>{t(`aboutShogi.uniqueRules.${i}`)}</li>
          ))}
        </ul>
      </div>

      <div className={styles.divider}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <div className={styles.section}>
        <h2>{t("aboutShogi.chessTitle")}</h2>
        <p>{t("aboutShogi.chessBody")}</p>
      </div>
    </PageContainer>
  );
}
