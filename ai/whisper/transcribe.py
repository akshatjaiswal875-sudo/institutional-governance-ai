import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

try:
    from faster_whisper import WhisperModel
except Exception as exc:  # pragma: no cover
    print(f"IMPORT_ERROR: {exc}", file=sys.stderr)
    raise


def extract_audio(input_path: Path, output_path: Path) -> Path:
    if input_path.suffix.lower() in {".mp3", ".wav", ".m4a", ".aac", ".ogg"}:
        return input_path

    if not shutil_which("ffmpeg"):
        raise RuntimeError("ffmpeg is required to extract audio from video files.")

    subprocess.run([
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        str(output_path),
    ], check=True, capture_output=True)
    return output_path


def shutil_which(name: str) -> bool:
    return shutil.which(name) is not None


def main() -> int:
    parser = argparse.ArgumentParser(description="Local Whisper transcription worker")
    parser.add_argument("input_path", help="Path to the audio/video file")
    parser.add_argument("--model", default=os.getenv("WHISPER_MODEL", "small"), help="faster-whisper model size")
    args = parser.parse_args()

    source = Path(args.input_path).expanduser().resolve()
    if not source.exists():
        raise FileNotFoundError(f"Input file not found: {source}")

    model_size = args.model
    tmp_audio = source.with_suffix(".wav")
    try:
        audio_path = extract_audio(source, tmp_audio)
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, _ = model.transcribe(str(audio_path), vad_filter=True, word_timestamps=False)
        transcript = "\n".join(segment.text.strip() for segment in segments if segment.text and segment.text.strip())
        if not transcript:
            raise RuntimeError("Whisper returned an empty transcript.")
        print(transcript)
        return 0
    finally:
        if tmp_audio.exists() and tmp_audio != source:
            try:
                tmp_audio.unlink()
            except OSError:
                pass


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"WHISPER_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
