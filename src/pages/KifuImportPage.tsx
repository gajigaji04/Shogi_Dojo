import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { decodeKifBytes, parseKif } from "../game/notation/kifParser";
import { saveCompletedGame } from "../game/storage/gameStorage";
import { useI18n } from "../i18n/I18nContext";
import styles from "./KifuImportPage.module.css";

export function KifuImportPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const text = decodeKifBytes(buffer);
      const result = parseKif(text);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const opponentLabel =
        result.players.sente && result.players.gote
          ? `${result.players.sente} vs ${result.players.gote}`
          : (result.players.gote ?? result.players.sente ?? file.name.replace(/\.(kif|kifu)$/i, ""));
      const record = saveCompletedGame({
        opponentLabel,
        mode: "imported",
        status: result.finalState.status,
        winner: result.finalState.winner,
        humanPlayer: "sente",
        history: result.finalState.history,
      });
      navigate(`/replay/${record.id}`);
    } catch {
      setError(t("errors.illegalMove"));
    } finally {
      setParsing(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("kifu.title")}</h1>

      <div
        className={[styles.dropZone, dragActive ? styles.dropZoneActive : ""].join(" ")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <div className={styles.hint}>{t("kifu.dropHint")}</div>
        <div className={styles.formats}>{t("kifu.supportedFormats")}</div>
        <input
          ref={inputRef}
          type="file"
          accept=".kif,.kifu"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {parsing && <p className={styles.status}>{t("kifu.parsing")}</p>}
      {error && (
        <div className={styles.error}>
          <strong>{t("kifu.parseErrorTitle")}</strong>
          {error}
        </div>
      )}
    </PageContainer>
  );
}
