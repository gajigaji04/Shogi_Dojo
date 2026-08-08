import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { ShogiBoard } from "../components/shogi/ShogiBoard";
import { PieceMoveDemo } from "../components/learning/PieceMoveDemo";
import { PromotionDemo } from "../components/learning/PromotionDemo";
import { DropDemo } from "../components/learning/DropDemo";
import { createInitialBoard } from "../game/state/gameState";
import type { PieceType } from "../game/types/shogi";
import { useI18n } from "../i18n/I18nContext";
import styles from "./LearnPage.module.css";

const GUIDE_PIECES: PieceType[] = ["OU", "HI", "KA", "KI", "GI", "KE", "KY", "FU"];
const initialBoard = createInitialBoard();

const STEP_COUNT = 6;

export function LearnPage() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [guidePiece, setGuidePiece] = useState<PieceType>("HI");
  const [practicePiece, setPracticePiece] = useState<PieceType>("GI");

  return (
    <PageContainer>
      <h1>{t("learn.prologueTitle")}</h1>

      <div className={styles.dots} role="tablist" aria-label={t("learn.prologueTitle")}>
        {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={step === n}
            aria-label={`Step ${n}`}
            className={[styles.dot, step === n ? styles.dotActive : ""].join(" ")}
            onClick={() => setStep(n)}
          />
        ))}
      </div>

      {step === 1 && (
        <div className={styles.stepPanel}>
          <h2 className={styles.stepTitle}>{t("learn.step1Title")}</h2>
          <p className={styles.stepBody}>{t("learn.step1Body")}</p>
          <div className={styles.demoArea}>
            <ShogiBoard board={initialBoard} interactive={false} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.stepPanel}>
          <h2 className={styles.stepTitle}>{t("learn.step2Title")}</h2>
          <p className={styles.stepBody}>{t("learn.step2Body")}</p>
          <div className={styles.pieceGrid}>
            {GUIDE_PIECES.map((type) => (
              <div key={type} className={styles.pieceCard}>
                <h4>{t(type === "OU" ? "piece.OU_sente" : `piece.${type}`)}</h4>
                <p>{t(`pieceDesc.${type === "OU" ? "OU" : type}`)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.stepPanel}>
          <h2 className={styles.stepTitle}>{t("learn.step3Title")}</h2>
          <p className={styles.stepBody}>{t("learn.step3Body")}</p>
          <div className={styles.pieceSelectRow}>
            {GUIDE_PIECES.map((type) => (
              <RetroButton
                key={type}
                size="small"
                variant={practicePiece === type ? "primary" : "default"}
                onClick={() => setPracticePiece(type)}
              >
                {t(type === "OU" ? "piece.OU_sente" : `piece.${type}`)}
              </RetroButton>
            ))}
          </div>
          <div className={styles.demoArea}>
            <PieceMoveDemo key={practicePiece} type={practicePiece} />
            <p className={styles.stepBody} style={{ textAlign: "center" }}>
              {t("game.selectPieceHint")}
            </p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={styles.stepPanel}>
          <h2 className={styles.stepTitle}>{t("learn.step4Title")}</h2>
          <p className={styles.stepBody}>{t("learn.step4Body")}</p>
          <div className={styles.demoArea}>
            <PromotionDemo />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className={styles.stepPanel}>
          <h2 className={styles.stepTitle}>{t("learn.step5Title")}</h2>
          <p className={styles.stepBody}>{t("learn.step5Body")}</p>
          <div className={styles.demoArea}>
            <DropDemo />
          </div>
        </div>
      )}

      {step === 6 && (
        <div className={styles.stepPanel}>
          <h2 className={styles.stepTitle}>{t("learn.step6Title")}</h2>
          <p className={styles.stepBody}>{t("learn.step6Body")}</p>
          <Link to="/learn/tutorial">
            <RetroButton variant="primary">{t("learn.startTutorial")}</RetroButton>
          </Link>
        </div>
      )}

      <div className={styles.nav}>
        <RetroButton onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          {t("common.back")}
        </RetroButton>
        <RetroButton onClick={() => setStep((s) => Math.min(STEP_COUNT, s + 1))} disabled={step === STEP_COUNT}>
          {t("common.next")}
        </RetroButton>
      </div>

      <hr style={{ margin: "48px 0 24px", border: "none", borderTop: "1px solid var(--line)" }} />

      <h2>{t("learn.pieceGuideTitle")}</h2>
      <div className={styles.guideGrid}>
        <ul className={styles.guideList}>
          {GUIDE_PIECES.map((type) => (
            <li key={type}>
              <button
                type="button"
                className={guidePiece === type ? styles.guideActive : ""}
                onClick={() => setGuidePiece(type)}
              >
                {t(type === "OU" ? "piece.OU_sente" : `piece.${type}`)}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.demoArea}>
          <PieceMoveDemo key={guidePiece} type={guidePiece} />
          <p className={styles.stepBody} style={{ textAlign: "center" }}>
            {t(`pieceDesc.${guidePiece}`)}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
