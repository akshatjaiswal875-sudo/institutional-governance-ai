import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function transcribeLocalAudio(file: File): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(process.cwd(), ".tmp-whisper-"));
  const inputPath = path.join(tempDir, path.basename(file.name || "recording.wav"));
  const model = process.env.WHISPER_MODEL || "tiny";
  const python = process.env.WHISPER_PYTHON || (process.platform === "win32"
    ? path.join(process.cwd(), ".venv", "Scripts", "python.exe")
    : path.join(process.cwd(), ".venv", "bin", "python"));
  const worker = path.join(process.cwd(), "ai", "whisper", "transcribe.py");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    return await new Promise<string>((resolve, reject) => {
      const child = spawn(python, [worker, inputPath, "--model", model], {
        cwd: process.cwd(),
        env: { ...process.env, WHISPER_MODEL: model, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || "Local whisper transcription failed."));
          return;
        }

        const transcript = stdout.trim();
        if (!transcript) {
          reject(new Error("Whisper returned an empty transcript."));
          return;
        }

        resolve(transcript);
      });

      child.on("error", reject);
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
