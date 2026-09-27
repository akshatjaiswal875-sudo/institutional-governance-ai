# Local Whisper Worker

This worker provides local transcription for meeting recordings before the transcript is sent to Gemini for meeting intelligence analysis.

## Requirements

- Python 3.10+
- pip
- ffmpeg (required for video files and recommended for audio extraction)

## Windows setup

1. Install Python 3.10+.
2. Open a terminal in the project root.
3. Create a virtual environment:
   python -m venv .venv
   .\.venv\Scripts\activate
4. Install requirements:
   python -m pip install --upgrade pip
   python -m pip install -r ai/whisper/requirements.txt
5. Install ffmpeg and ensure it is available on PATH.
6. Run the worker:
   python ai/whisper/transcribe.py "C:/path/to/meeting.mp3" --model small

## Notes

- Default Whisper model: small
- Supported inputs: mp3, wav, m4a, mp4, webm
- The worker runs locally and does not send audio to Gemini.
- The app calls this worker server-side only.
