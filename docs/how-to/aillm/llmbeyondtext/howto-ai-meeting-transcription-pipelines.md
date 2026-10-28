---
title: How to Build AI Meeting Transcription Pipelines (Whisper, pyannote, Streaming
  APIs)
diataxis: How-to Guide
domain: AI-LLM
topic: LLM-Beyond-Text
source: DEV.to Tech News
source_url: https://dev.to/albert_nahas_cdc8469a6ae8/ai-meeting-transcription-in-2025-what-actually-works-3o6c
date: 2026-10-27
keywords:
- knowledge-base
- LLM-Beyond-Text
- AI-LLM
- how-to
---
# How to Build AI Meeting Transcription Pipelines (Whisper, pyannote, Streaming APIs)

Three pillars decide whether a transcription pipeline is usable: **accuracy** (word error rate on real-world audio — noise, crosstalk, jargon), **diarization** (who said what), and **real-time capability** (live captions vs post-hoc notes).

## 1. Transcription
- **General cloud models** (Google Speech-to-Text, Azure Speech): strong on clean audio, weak on domain jargon.
- **Custom / open-source** (OpenAI Whisper, NVIDIA NeMo): fine-tune for company terminology; Whisper also runs on-premises for data privacy.

Whisper from a Node backend:
```ts
import { exec } from 'child_process';

function transcribeAudio(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`whisper ${filePath} --language en --model medium`, (error, stdout) =>
      error ? reject(error) : resolve(stdout));
  });
}
```
(Whisper writes the transcript to a `.txt` file by default — capture the file, not just stdout.)

## 2. Diarization (who said what)
- Traditional acoustic-feature clustering struggles with short utterances and rapid turn-taking; deep-embedding models (**pyannote-audio**) separate voices more reliably; multimodal cues (video, participant lists) help on large calls.
- Align diarization segments with the transcript to label each sentence:
```python
from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")

diarization = pipeline("meeting_audio.wav")
for speech_turn in diarization.itertracks(yield_label=True):
    start_time, end_time = speech_turn[0]
    speaker = speech_turn[2]
    print(f"{start_time:.2f}s - {end_time:.2f}s: {speaker}")
```
- Ship a **diarization confidence score** and allow post-call correction — overlapping speech and similar voices will always produce some errors.

**Follow-ups (verified 2026-10-27):**
- The current open pipeline is **`pyannote/speaker-diarization-3.1`** (requires `pyannote.audio >= 3.1`). It is the 3.0 pipeline minus `onnxruntime` — both segmentation and embeddings run in pure PyTorch, which eases deployment. It ingests mono 16 kHz audio (multi-channel is auto-downmixed, other sample rates auto-resampled). You must accept the HF user conditions for `pyannote/segmentation-3.0` and `pyannote/speaker-diarization-3.1` and pass an access token; `num_speakers` / `min_speakers` / `max_speakers` let you constrain known participant counts, and `pipeline.to(torch.device("cuda"))` moves it to GPU.
- For a hosted variant, pyannote's own tutorial combines the **pyannoteAI diarization API with OpenAI Whisper** in a decoupled pipeline: run both independently, then align their outputs at **segment level using overlapping timestamps** (Whisper has no speaker awareness; pyannoteAI has no text). Each component can be swapped without touching the other.

## 3. Real-time / streaming
Cloud streaming APIs deliver interim results; e.g. Google Cloud Speech (Node):
```ts
const request = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
    enableSpeakerDiarization: true,
  },
  interimResults: true,
};

const recognizeStream = client.streamingRecognize(request)
  .on('data', data =>
    console.log(`Transcription: ${data.results[0].alternatives[0].transcript}`)
  );

audioInputStream.pipe(recognizeStream);
```
Interim results enable live captions and trigger automations (e.g. "let's follow up" → task creation). For sensitive environments, on-device inference (WebAssembly, TensorFlow.js) is feasible for small groups — usually with slightly lower accuracy and higher hardware demands.

## Choosing an approach
| Approach | Pros | Cons |
| --- | --- | --- |
| Native platform (Zoom, Meet, Teams) | seamless, basic real-time captions | limited customization, variable diarization, weak export/search |
| Dedicated apps (Otter, Fireflies, Recallix) | advanced diarization, topic extraction, action items, integrations (Slack, Notion, Zapier) | varying accuracy, privacy considerations, cost |
| Custom (Whisper + pyannote + LLM) | maximum control, custom vocabularies, on-prem deployment | ML/DevOps expertise and ongoing maintenance required |

## Further reading

- [WhisperX](https://github.com/m-bain/whisperx) — the standard glue layer for production Whisper pipelines: word-level forced alignment plus pyannote diarization in one call (`assign_word_speakers`), which is the cleanest way to attach speaker labels to word timestamps instead of hand-rolling alignment.
- [AssemblyAI: Does Whisper do speaker diarization?](https://www.assemblyai.com/blog/whisper-speaker-diarization) — where the DIY Whisper+pyannote pipeline cracks (overlap, short turns, noise) and the managed single-call alternative (transcript + speaker labels together, ~30 cpWER, $0.21/hr). Useful benchmark when deciding DIY vs. managed.
- [Whisper large-v3 on Groq](https://console.groq.com/docs/model/whisper-large-v3) — if the local-pyannote pipeline is too slow for your meeting volume, large-v3 is available as an inference-API alternative that keeps the same model quality.

## References
- [AI Meeting Transcription in 2025: What Actually Works (DEV.to)](https://dev.to/albert_nahas_cdc8469a6ae8/ai-meeting-transcription-in-2025-what-actually-works-3o6c)
- [OpenAI Whisper](https://github.com/openai/whisper) · [pyannote-audio](https://github.com/pyannote/pyannote-audio)
- [pyannote/speaker-diarization-3.1 (Hugging Face model card)](https://huggingface.co/pyannote/speaker-diarization-3.1)
- [Multi-Speaker meeting transcription with Whisper (pyannoteAI + Whisper production tutorial)](https://www.pyannote.ai/blog/multi-speaker-meeting-transcription-pyannoteai-whisper)
