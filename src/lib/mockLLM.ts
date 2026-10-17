/** Fake LLM response generator for the demo (no real backend) */
import { rng } from './rand'

/** Hangul syllables (Korean user input is still tokenized sensibly) */
const HANGUL = /[\uAC00-\uD7A3]/g

const SNIPPETS: { re: RegExp; reply: (model: string) => string }[] = [
  {
    re: /(code|coding|python|function|javascript|typescript)/i,
    reply: (m) => `Sure. Here's how to call the InferStack API with an OpenAI-compatible SDK.

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.inferstack.dev/v1",
    api_key="sk-is-v1-...",
)

resp = client.chat.completions.create(
    model="${m}",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True,
)
for chunk in resp:
    print(chunk.choices[0].delta.content or "", end="")
\`\`\`

Key points:
1. Change only \`base_url\` — your existing OpenAI code works as-is.
2. Set \`model\` to a catalog slug (e.g. \`${m}\`).
3. Pass \`stream=True\` to receive tokens as they're generated.`,
  },
  {
    re: /\b(hello|hi|hey)\b/i,
    reply: (m) => `Hi! I'm **${m}**, served on InferStack.

How can I help? For example, I can:
- Summarize and translate documents
- Write and review code
- Brainstorm approaches to data analysis
- Reason through complex problems step by step`,
  },
  {
    re: /(gguf|safetensors|quant)/i,
    reply: () => `Here's a quick comparison of **GGUF vs. safetensors**.

| | GGUF | Safetensors |
|---|---|---|
| Primary runtime | llama.cpp | vLLM / SGLang / TensorRT-LLM |
| Quantization | Baked into the file (Q4_K_M, etc.) | Chosen at serve time (FP8/AWQ/GPTQ) |
| Strengths | Single file, low VRAM | High throughput, efficient batching |
| Best for | Small to mid-size models, cost optimization | Large models, production traffic |

InferStack accepts both formats and picks the right inference engine automatically.`,
  },
  {
    re: /(pric|cost|billing)/i,
    reply: (m) => `InferStack uses **pay-as-you-go, per-token pricing**. Input and output token prices for \`${m}\` are listed on its model page, and cached input tokens are 75% off. Credits are prepaid and deducted as you use them.`,
  },
]

const GENERIC = [
  (m: string, q: string) => `Good question. Let's work through "${q.slice(0, 60)}${q.length > 60 ? '…' : ''}" step by step.

**1. Define the problem**
Start by clarifying what you're trying to solve. Separating goals, constraints, and success criteria makes the right approach much clearer.

**2. Key considerations**
- Data and context: what do you already have, and what's missing?
- Trade-offs: balancing speed, cost, and accuracy
- Validation: how will you check that the result is correct?

**3. Recommendation**
Start small, validate quickly, and iterate based on what you learn.

_(This is a simulated ${m} response from the InferStack demo.)_`,
]

export function mockReply(model: string, prompt: string): string {
  const hit = SNIPPETS.find((s) => s.re.test(prompt))
  if (hit) return hit.reply(model)
  const r = rng(prompt + model)
  return GENERIC[Math.floor(r() * GENERIC.length)](model, prompt)
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars/token for Latin text, ~1.5 chars/token for Hangul
  const ko = (text.match(HANGUL) ?? []).length
  return Math.max(1, Math.round(ko / 1.5 + (text.length - ko) / 4))
}

/** Splits text into token-sized pieces to simulate streaming */
export function* chunkText(text: string): Generator<string> {
  const parts = text.match(/(\s+|[\uAC00-\uD7A3]{1,2}|[^\s\uAC00-\uD7A3]{1,4})/g) ?? [text]
  for (const p of parts) yield p
}
