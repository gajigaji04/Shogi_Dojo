import type { Difficulty } from "../../game/ai/cpuPlayer";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./DifficultySelect.module.css";

const DIFFICULTIES: { value: Difficulty; key: string }[] = [
  { value: "beginner", key: "game.difficultyBeginner" },
  { value: "easy", key: "game.difficultyEasy" },
  { value: "normal", key: "game.difficultyNormal" },
  { value: "hard", key: "game.difficultyHard" },
  { value: "expert", key: "game.difficultyExpert" },
];

interface DifficultySelectProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

export function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  const { t } = useI18n();
  return (
    <div className={styles.list} role="radiogroup" aria-label={t("game.difficulty")}>
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          type="button"
          role="radio"
          aria-checked={value === d.value}
          className={[styles.option, value === d.value ? styles.optionActive : ""].join(" ")}
          onClick={() => onChange(d.value)}
        >
          <span className={styles.radio} aria-hidden="true" />
          {t(d.key)}
        </button>
      ))}
    </div>
  );
}
