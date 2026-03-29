# Vocal Intelligence Platform (VIP)

A production-grade React/Vite application for real-time vocal confidence analysis, interpreter readiness scoring, and AI-powered coaching. Built for healthcare language services professionals.

---

## Features

### Live Analyzer
Real-time audio via Web Audio API: confidence, fluency, cognitive load, composure rings, volume/pitch/pace metrics, live waveform, stress signal panel, speech-to-text transcription, and verbal NLP signals (vocab diversity, filler words, word count).

### Scenario Practice
Eight built-in scenarios across Healthcare, Language Services, and Leadership — each with a weighted rubric producing an overall readiness score.

**Healthcare:** Discharge instructions, Informed consent, Triage intake, Mental health disclosure  
**Language Services:** Interpreter role handoff, Interpreter intervention (advanced)  
**Leadership:** Executive briefing, Coaching conversation

### AI Coaching
Claude-powered post-session reports: strength, improvement area, drill, and encouragement — personalized to your role. Interpreter readiness rating included for language services sessions.

### Progress Dashboard
Session history (50 sessions, localStorage), confidence + fluency trend chart, rolling stats, interpreter readiness level.

### User Profiles
Name, role, org onboarding — persisted locally, no backend required.

---

## Stack

React 19 + Vite 8 · Web Audio API · Web Speech API · Anthropic Claude API · localStorage · CSS variables · Sora + DM Mono fonts · Vercel

---

## Local Development

```bash
git clone https://github.com/emmkiprono-coder/vocal-intel.git
cd vocal-intel
npm install
npm run dev
```

Open `http://localhost:5173`. Chrome or Edge recommended for full speech-to-text support.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect the GitHub repo at vercel.com. Framework: Vite. Build: `npm run build`. Output: `dist`.

---

## Push to GitHub

```bash
cd vocal-intel
git init
git add .
git commit -m "feat: Vocal Intelligence Platform v1"
git remote add origin https://github.com/emmkiprono-coder/vocal-intel.git
git branch -M main
git push -u origin main
```

---

## Project Structure

```
src/
├── data/scenarios.js          # 8 scenarios, rubrics, readiness scale
├── hooks/
│   ├── useAudioAnalyzer.js    # Web Audio pitch/volume/stress engine
│   ├── useSpeechRecognition.js
│   └── useProfile.js          # localStorage sessions + profile
├── utils/audio.js             # autoCorrelate, NLP, score helpers
├── components/UI.jsx          # ScoreRing, MetricCard, StressBar, RubricBar...
├── pages/
│   ├── ProfileSetup.jsx
│   ├── LiveAnalyzer.jsx
│   ├── ScenarioPractice.jsx
│   ├── AICoaching.jsx
│   └── Progress.jsx
├── App.jsx
└── index.css
```

---

## Interpreter Readiness Scale

| Score | Level | Status |
|---|---|---|
| 0–49 | Not ready | Not cleared |
| 50–64 | Developing | Supervised practice |
| 65–79 | Approaching ready | Supervised encounters |
| 80–89 | Ready | Standard clinical encounters |
| 90–100 | Proficient | Complex/advanced cases |

---

## Signal Disclaimer

Stress and cognitive load signals reflect mental effort and arousal — not deception. Verbal fluency scores are proxies for oral language proficiency, not literacy. All signals should be interpreted with professional context.

---

MIT license — built for Advocate Health language services.
