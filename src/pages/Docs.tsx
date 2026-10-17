import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Badge, Card, CodeBlock } from '../components/ui'
import { REQUIREMENTS_TEMPLATE, SPEC_TREE, manifestTemplate, modelPyTemplate } from '../data/customArchSpec'

const TOC = [
  ['quickstart', 'Quickstart'],
  ['auth', 'Authentication'],
  ['api', 'Chat Completions'],
  ['models-api', 'List models'],
  ['routing', 'Routing & fallbacks'],
  ['errors', 'Error codes'],
  ['custom', 'Custom models API'],
  ['cli', 'CLI reference'],
  ['arch', 'Architecture package spec'],
  ['billing', 'Billing'],
] as const

export default function Docs() {
  const loc = useLocation()
  useEffect(() => {
    if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [loc.hash])

  return (
    <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-20 space-y-1 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg3">Docs</div>
          {TOC.map(([id, l]) => (
            <a
              key={id}
              href={`#/docs#${id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="block rounded-md px-2 py-1 text-fg2 hover:bg-raised hover:text-fg"
            >
              {l}
            </a>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 max-w-3xl space-y-14 [&_p_code]:rounded [&_p_code]:bg-raised [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:text-[0.86em] [&_li_code]:rounded [&_li_code]:bg-raised [&_li_code]:px-1.5 [&_li_code]:text-[0.86em] [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-fg2">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">InferStack docs</h1>
          <p className="mt-3">InferStack is an inference platform that serves the latest open-source LLMs through an OpenAI-compatible API, and deploys models you upload as serverless endpoints.</p>
        </section>

        <section>
          <h2 id="quickstart">Quickstart</h2>
          <p className="mt-3">
            1) <Link to="/keys" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">Create an API key</Link> → 2) <Link to="/credits" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">Add credits</Link> → 3) Point the OpenAI SDK's <code>base_url</code> at InferStack.
          </p>
          <CodeBlock
            className="mt-4"
            lang="python"
            code={`pip install openai

from openai import OpenAI
client = OpenAI(base_url="https://api.inferstack.dev/v1", api_key="sk-is-v1-...")

r = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Hello"}],
)
print(r.choices[0].message.content)`}
          />
        </section>

        <section>
          <h2 id="auth">Authentication</h2>
          <p className="mt-3">
            Every request requires an <code>Authorization: Bearer sk-is-v1-…</code> header. Optionally send <code>X-Title</code> and <code>HTTP-Referer</code> headers to have your app listed on the Rankings page.
          </p>
        </section>

        <section>
          <h2 id="api">Chat Completions</h2>
          <p className="mt-3">
            <Badge color="green">POST</Badge> <code className="font-mono">/v1/chat/completions</code>. Same schema as OpenAI Chat Completions.
          </p>
          <Card className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-fg3">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 font-medium">Parameter</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="[&_td]:px-3 [&_td]:py-2 [&_td:first-child]:px-4 [&_tr]:border-b [&_tr]:border-line">
                {[
                  ['model', 'string', 'Model slug, e.g. z-ai/glm-5.3 or demo/my-model'],
                  ['messages', 'array', 'Array of role/content messages. content is a string or an array of text and image_url parts'],
                  ['stream', 'boolean', 'Stream the response over SSE'],
                  ['temperature / top_p / top_k', 'number', 'Sampling parameters'],
                  ['max_tokens', 'integer', 'Maximum number of tokens to generate'],
                  ['tools / tool_choice', 'array / string', 'Tool calls (function calling)'],
                  ['response_format', 'object', '{"type":"json_object"} (JSON mode) or json_schema'],
                  ['reasoning', 'object', '{"effort":"low|medium|high"}. Reasoning models only.'],
                  ['provider', 'object', 'Routing preferences (see below)'],
                  ['models', 'string[]', 'Fallback models, tried in order if the first one fails'],
                ].map(([a, b, c]) => (
                  <tr key={a}>
                    <td className="font-mono text-xs">{a}</td>
                    <td className="text-xs text-fg3">{b}</td>
                    <td>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <h3>Response usage</h3>
          <CodeBlock
            className="mt-3"
            lang="json"
            code={`"usage": {
"prompt_tokens": 1204,
"completion_tokens": 311,
"prompt_tokens_details": { "cached_tokens": 1024 },
"cost": 0.000614,
"provider": "us-east-1"
}`}
          />
        </section>

        <section>
          <h2 id="models-api">List models</h2>
          <p className="mt-3">
            <Badge color="brand">GET</Badge> <code className="font-mono">/v1/models</code> returns catalog models together with the custom models you've deployed. Each item includes <code>pricing</code>, <code>context_length</code>, <code>architecture</code>, and <code>hugging_face_id</code>.
          </p>
        </section>

        <section>
          <h2 id="routing">Routing & fallbacks</h2>
          <p className="mt-3">Each model is served from multiple endpoints across regions, GPUs, and quantizations. By default, requests are routed automatically to the nearest healthy endpoint, balancing price, latency, and uptime.</p>
          <CodeBlock
            className="mt-4"
            lang="json"
            code={`{
"model": "qwen/qwen3.8-27b",
"messages": [...],
"provider": {
"order": ["us-east-1", "eu-central-1"],
"allow_fallbacks": true,
"quantizations": ["bf16", "fp8"],
"data_collection": "deny",
"sort": "throughput"
  },
"models": ["qwen/qwen3.8-27b", "google/gemma-4-31b-it"]
}`}
          />
        </section>

        <section>
          <h2 id="errors">Error codes</h2>
          <Card className="mt-4 divide-y divide-line text-sm">
            {[
              ['400', 'Bad request (invalid parameters)'],
              ['401', 'Invalid or disabled API key'],
              ['402', 'Insufficient credits or key limit exceeded'],
              ['403', 'Model not allowed for this key'],
              ['408', 'Request timed out'],
              ['429', 'Rate limited (free tier: 20 requests/min)'],
              ['502', 'Upstream endpoint error. Fallback attempted.'],
              ['503', 'No endpoint available (including custom model cold starts)'],
            ].map(([c, d]) => (
              <div key={c} className="flex gap-4 px-4 py-2">
                <span className="w-10 font-mono font-semibold">{c}</span>
                <span className="text-fg2">{d}</span>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h2 id="custom">Custom models API</h2>
          <p className="mt-3">Everything the upload wizard in the dashboard does is also available through the REST API.</p>
          <CodeBlock
            className="mt-4"
            lang="bash"
            code={`# Import from Hugging Face and deploy
curl https://api.inferstack.dev/v1/custom-models \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
"slug": "my-qwen-ft",
"source": { "type": "huggingface", "repo": "acme/qwen3.8-27b-ft", "revision": "main", "token": "hf_..." },
"weights": { "format": "safetensors", "dtype": "bfloat16", "quantization": "fp8" },
"architecture": "Qwen3_5ForConditionalGeneration",
"hardware": { "gpu": "H100", "count": 1, "min_replicas": 0, "max_replicas": 4 },
"context_length": 131072,
"visibility": "private"
  }'

# ModelScope / GGUF
#"source": { "type": "modelscope", "repo": "Qwen/Qwen3.8-27B-GGUF" },
#"weights": { "format": "gguf", "file": "Qwen3.8-27B-Q4_K_M.gguf" }

# New architecture: point to an inference code package
#"architecture": "BeamForCausalLM",
#"code": { "type": "github", "repo": "acme/beam-inferstack", "ref": "v0.1.0", "subdir": "pkg" }

# Check status
curl https://api.inferstack.dev/v1/custom-models/my-qwen-ft \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY"`}
          />
        </section>

        <section>
          <h2 id="cli">CLI reference</h2>
          <CodeBlock
            className="mt-4"
            lang="bash"
            code={`pip install -U inferstack-cli
inferstack login --key sk-is-v1-...

# Upload local weights (multipart, resumable)
inferstack models create my-model --format gguf
inferstack upload ./my-model-Q4_K_M.gguf --model my-model --parallel 8

# safetensors directory + custom architecture code
inferstack models create beam-ft --format safetensors --arch BeamForCausalLM
inferstack upload ./beam-ft/ --model beam-ft
inferstack code push ./beam-inferstack/ --model beam-ft     # directory containing inferstack.yaml

# Import from a remote source
inferstack models import hf://Qwen/Qwen3.8-27B --slug qwen-27b --gpu H100
inferstack models import modelscope://Qwen/Qwen3.8-27B --slug qwen-27b-ms

# Deploy / status / logs
inferstack deploy my-model --gpu L40S --min 0 --max 2
inferstack models status my-model
inferstack logs my-model --follow

# Validate a package locally (before deploying)
inferstack code validate ./beam-inferstack/`}
          />
        </section>

        <section>
          <h2 id="arch">Architecture package spec (v1)</h2>
          <p className="mt-3">
            If your architecture isn't in the InferStack registry (<Link to="/deploy" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">supported architectures</Link>), upload an inference code package that follows the spec below, from a GitHub repository or a local directory. The runtime matches <code>architectures[0]</code> in <code>config.json</code> against <code>metadata.architectures</code> in the manifest to load the entrypoint class.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-raised p-4 font-mono text-xs">{SPEC_TREE}</pre>
          <h3>inferstack.yaml</h3>
          <CodeBlock className="mt-3" lang="yaml" code={manifestTemplate('BeamForCausalLM', 'beam')} />
          <h3>model.py: the InferStackModel interface</h3>
          <Card className="mt-3 divide-y divide-line text-sm">
            {[
              ['load(weights_dir, config, device_map)', 'Loads the weights. Tensor-parallel rank info is passed in device_map.'],
              ['tokenize(messages, tools)', 'Chat messages → token IDs. Responsible for applying the chat template.'],
              ['generate(req) → Iterator[TokenChunk]', 'Yield tokens; the runtime handles SSE streaming, billing, and stop sequences.'],
              ['health() → bool', 'Health check. Replicas that return False are replaced.'],
            ].map(([a, b]) => (
              <div key={a} className="px-4 py-2.5">
                <div className="font-mono text-xs font-medium">{a}</div>
                <div className="text-fg2">{b}</div>
              </div>
            ))}
          </Card>
          <CodeBlock className="mt-4" lang="python" code={modelPyTemplate('BeamForCausalLM')} />
          <h3>requirements.txt</h3>
          <CodeBlock className="mt-3" lang="text" code={REQUIREMENTS_TEMPLATE} />
          <h3>Validation rules</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-fg2">
            <li>
              <code>inferstack.yaml</code> and <code>model.py</code> are required · Package must be 50 MB or smaller (no weights)
            </li>
            <li>
              If <code>runtime.base</code> is <code>vllm</code>/<code>sglang</code>, the model is registered through that engine's model plugin API; if it's <code>custom</code>, <code>generate()</code> is called directly
            </li>
            <li>Builds install only requirements.txt and run in a network-isolated environment</li>
            <li>
              If <code>tests/test_smoke.py</code> exists, it runs against tiny random weights before deployment
            </li>
          </ul>
        </section>

        <section>
          <h2 id="billing">Billing</h2>
          <p className="mt-3">
            Catalog models are billed per input and output token, and cached input tokens are 75% off. Private custom models are billed per second of GPU time. Public marketplace models are billed to callers per token, and the provider receives 80% of the revenue. See{' '}
            <Link to="/pricing" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">
              Pricing
            </Link>{' '}
            for details.
          </p>
        </section>
      </article>
    </div>
  )
}
