<p align="center">
  <img src="public/brand/inferstack-logo-dark.svg#gh-dark-mode-only" width="320" alt="InferStack" />
  <img src="public/brand/inferstack-logo.svg#gh-light-mode-only" width="320" alt="InferStack" />
</p>

# InferStack — inference platform for open models (frontend demo)

A frontend demo of an OpenRouter-style **unified API platform for open-source LLMs**.
There is no real backend: inference, billing, and deployments are simulated in the browser
(state is persisted to `localStorage`). Hugging Face and GitHub integrations call their real public APIs.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ (static hosting friendly, uses HashRouter)
```

## Features

| Area | What's included |
|---|---|
| Branding | Three-layer stack logo (`public/brand/*.svg`, `public/favicon.svg`, `src/components/Logo.tsx`) |
| Home | Hero with model search, new and popular models, code samples, bring-your-own-model overview, **live Hugging Face trending** |
| Model catalog | 36 of the latest open LLMs as of October 2026 (DeepSeek V4.1, Qwen3.8, GLM-5.3, Kimi K3, MiMo V2.6, Gemma 4, gpt-oss, LFM2.5, Ling 3.1, and more). Architecture, parameters, context length, and license come from Hugging Face Hub metadata; each model has input, output, and cached-input pricing |
| Model detail | Endpoints (region, GPU, quantization, throughput, latency/TTFT, uptime), API examples, usage charts, live Hugging Face info |
| Chat | Compare up to 3 models side by side, simulated streaming, token / cost / tok/s stats, credit deduction |
| API keys | Create (shown once), credit limits, expiration, allowed-model restrictions, disable / delete |
| Credits / Activity | Add credits (demo), auto top-up, promo codes, daily cost and token charts, request logs, CSV export |
| Rankings / Pricing / Docs | Weekly token rankings, provider share, model and GPU price tables, API / CLI / architecture package docs |
| **Model upload** | 5-step wizard (below) plus model management (build logs, pause, public / private, delete) |

All prices are in USD.

### Custom model upload flow

1. **Source** — Hugging Face (search autocomplete, revision, token for gated models) / ModelScope (API → HF mirror → name-based fallback) / CLI (command guide plus simulated upload; paste `config.json` to detect the architecture)
2. **Weight format** — Safetensors (dtype, FP8/NVFP4/AWQ/GPTQ serving quantization) or GGUF (automatically groups the repo's quantized files, supports split files)
3. **Architecture** — Auto-detected from `architectures` in the HF `config.json` or from GGUF `general.architecture`; choose from 45 architectures in the supported registry
   - For a **new architecture** not in the registry, upload inference code that follows the `inferstack.yaml` + `model.py` spec from **GitHub** (public repos validated live) or **local files** (drag and drop / folder picker). Templates are available to download
4. **Deployment settings** — VRAM estimate and GPU recommendation, autoscaling / scale-to-zero, context length, chat template, private or public on the marketplace (with pricing)
5. **Review → deploy** — Simulated build steps and logs, then Live; use it right away from Chat or the API

## Project structure

```
src/
  data/       models.ts (catalog) architectures.ts (registry, GPUs) customArchSpec.ts (package spec) types.ts
  lib/        hf.ts (HF Hub API) modelscope.ts github.ts build.ts (deploy simulation) mockLLM.ts format.ts
  store/      Zustand global state (keys, credits, logs, custom models; persisted to localStorage)
  components/ Layout, Logo, UI primitives, Markdown, ModelBits
  pages/      Home, Models, ModelDetail, Chat, Rankings, Docs, Pricing, Keys, Credits, Activity, Settings, SignIn, MyModels
  pages/deploy/ DeployHome, DeployWizard, SourceStep, FormatStep, ArchStep, ConfigStep
```

Stack: Vite · React 18 · TypeScript · Tailwind CSS · Zustand · Recharts · lucide-react
