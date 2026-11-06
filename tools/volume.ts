/**
 * Volume gelijk trekken met ffmpeg: elke opname op -16 LUFS (EBU R128).
 * Zo klinkt geen zin of getal harder of zachter dan de rest.
 */
import { spawnSync } from 'node:child_process';

export const DOEL_LUFS = -16;
export const heeftFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

/** Gemeten luidheid in LUFS, of null als het fragment te kort of stil is. */
export function meetLuidheid(mp3: Buffer): number | null {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', 'pipe:0', '-af', 'ebur128', '-f', 'null', '-'], {
    input: mp3,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
  });
  const tekst = r.stderr.toString();
  const m = /Summary:[\s\S]*?I:\s+(-?[\d.]+) LUFS/.exec(tekst);
  const lufs = m ? Number(m[1]) : NaN;
  return Number.isFinite(lufs) && lufs > -60 ? lufs : null;
}

/** Breng een mp3 naar de doelluidheid (met een begrenzer tegen oversturen). */
export function normaliseer(mp3: Buffer): { mp3: Buffer; was: number | null; aangepast: boolean } {
  if (!heeftFfmpeg) return { mp3, was: null, aangepast: false };
  const was = meetLuidheid(mp3);
  if (was === null || Math.abs(DOEL_LUFS - was) < 0.7) return { mp3, was, aangepast: false };
  const r = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0',
      '-af', `volume=${(DOEL_LUFS - was).toFixed(2)}dB,alimiter=limit=0.89:level=false`,
      '-ar', '44100', '-ac', '1', '-b:a', '96k', '-f', 'mp3', 'pipe:1',
    ],
    { input: mp3, maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status !== 0 || r.stdout.length === 0) return { mp3, was, aangepast: false };
  return { mp3: r.stdout, was, aangepast: true };
}
