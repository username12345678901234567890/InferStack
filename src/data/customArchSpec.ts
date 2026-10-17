/** Upload spec for custom inference code for new architectures (InferStack Architecture Package v1) */

export const REQUIRED_FILES = ['inferstack.yaml', 'model.py']
export const OPTIONAL_FILES = ['requirements.txt', 'tokenizer.py', 'tests/test_smoke.py', 'README.md']

export const SPEC_TREE = `my-architecture/
├── inferstack.yaml        # (required) package manifest
├── model.py               # (required) entrypoint implementing InferStackModel
├── requirements.txt       # (optional) extra pip dependencies
├── tokenizer.py           # (optional) custom tokenizer / chat template
└── tests/
    └── test_smoke.py      # (optional) pre-deploy smoke test`

export function manifestTemplate(arch = 'MyNewForCausalLM', name = 'my-architecture') {
  return `apiVersion: inferstack.dev/v1
kind: Architecture
metadata:
  name: ${name}
  # must exactly match "architectures" in config.json
  architectures: [${arch}]
  version: 0.1.0
spec:
  runtime:
    base: vllm            # vllm | sglang | transformers | custom
    python: "3.11"
    cuda: "12.8"
    torch: "2.9"
  entrypoint: model.py:${arch.replace(/ForCausalLM|ForConditionalGeneration/, '')}InferStack
  weights:
    formats: [safetensors]   # safetensors | gguf
  capabilities:
    streaming: true
    tools: false
    vision: false
    max_context: 131072
  resources:
    min_vram_gb: 80
    tensor_parallel: [1, 2, 4, 8]
  healthcheck:
    prompt: "Hello"
    max_tokens: 8
`
}

export function modelPyTemplate(arch = 'MyNewForCausalLM') {
  const cls = arch.replace(/ForCausalLM|ForConditionalGeneration/, '') + 'InferStack'
  return `"""InferStack Architecture Package — ${arch}"""
from typing import Iterator

import torch
from inferstack.runtime import (
    GenerateRequest,
    InferStackModel,
    TokenChunk,
    register,
)


@register("${arch}")
class ${cls}(InferStackModel):
    """Implements the 4 methods called by the InferStack runtime."""

    def load(self, weights_dir: str, config: dict, device_map: dict) -> None:
        # weights_dir: path to the weights mounted by InferStack (safetensors / gguf)
        # config:      contents of config.json
        # device_map:  assigned GPU info (including tensor-parallel rank)
        from .modeling import ${arch}  # your own modeling code
        self.model = ${arch}.from_pretrained(weights_dir, torch_dtype=torch.bfloat16)
        self.model.to(device_map["device"]).eval()
        self.tokenizer = self.load_tokenizer(weights_dir)

    def tokenize(self, messages: list[dict], tools: list[dict] | None = None) -> list[int]:
        return self.tokenizer.apply_chat_template(messages, tools=tools, add_generation_prompt=True)

    @torch.inference_mode()
    def generate(self, req: GenerateRequest) -> Iterator[TokenChunk]:
        # Yield tokens one at a time; InferStack handles SSE streaming, billing and logging
        input_ids = torch.tensor([req.input_ids], device=self.model.device)
        for token_id in self.model.stream_generate(
            input_ids,
            max_new_tokens=req.max_tokens,
            temperature=req.temperature,
            top_p=req.top_p,
            stop_token_ids=req.stop_token_ids,
        ):
            yield TokenChunk(id=token_id, text=self.tokenizer.decode([token_id]))

    def health(self) -> bool:
        return self.model is not None
`
}

export const REQUIREMENTS_TEMPLATE = `# List only dependencies not included in the InferStack base image
einops>=0.8
flash-linear-attention==0.4.1
`

export const SMOKE_TEST_TEMPLATE = `from inferstack.testing import load_package


def test_generate_smoke():
    model = load_package(".", weights="tiny-random")
    out = model.complete([{"role": "user", "content": "Hi"}], max_tokens=4)
    assert len(out.tokens) > 0
`

export function validateLocalFiles(names: string[]): { file: string; ok: boolean; required: boolean }[] {
  const set = new Set(names.map((n) => n.replace(/^[^/]+\//, (m) => (REQUIRED_FILES.includes(n) ? '' : m))))
  const has = (f: string) => names.some((n) => n === f || n.endsWith('/' + f)) || set.has(f)
  return [
    ...REQUIRED_FILES.map((f) => ({ file: f, ok: has(f), required: true })),
    ...OPTIONAL_FILES.map((f) => ({ file: f, ok: has(f), required: false })),
  ]
}
