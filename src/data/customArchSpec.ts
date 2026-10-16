/** 새 아키텍처용 커스텀 추론 코드 업로드 규격 (InferStack Architecture Package v1) */

export const REQUIRED_FILES = ['inferstack.yaml', 'model.py']
export const OPTIONAL_FILES = ['requirements.txt', 'tokenizer.py', 'tests/test_smoke.py', 'README.md']

export const SPEC_TREE = `my-architecture/
├── inferstack.yaml        # (필수) 패키지 매니페스트
├── model.py               # (필수) InferStackModel 구현 엔트리포인트
├── requirements.txt       # (선택) 추가 pip 의존성
├── tokenizer.py           # (선택) 커스텀 토크나이저 / 채팅 템플릿
└── tests/
    └── test_smoke.py      # (선택) 배포 전 스모크 테스트`

export function manifestTemplate(arch = 'MyNewForCausalLM', name = 'my-architecture') {
  return `apiVersion: inferstack.dev/v1
kind: Architecture
metadata:
  name: ${name}
  # config.json 의 "architectures" 값과 정확히 일치해야 합니다
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
    """InferStack 런타임이 호출하는 4개의 메서드를 구현합니다."""

    def load(self, weights_dir: str, config: dict, device_map: dict) -> None:
        # weights_dir: InferStack이 마운트한 가중치 경로 (safetensors / gguf)
        # config:      config.json 내용
        # device_map:  할당된 GPU 정보 (tensor-parallel rank 포함)
        from .modeling import ${arch}  # 직접 구현한 모델링 코드
        self.model = ${arch}.from_pretrained(weights_dir, torch_dtype=torch.bfloat16)
        self.model.to(device_map["device"]).eval()
        self.tokenizer = self.load_tokenizer(weights_dir)

    def tokenize(self, messages: list[dict], tools: list[dict] | None = None) -> list[int]:
        return self.tokenizer.apply_chat_template(messages, tools=tools, add_generation_prompt=True)

    @torch.inference_mode()
    def generate(self, req: GenerateRequest) -> Iterator[TokenChunk]:
        # 토큰을 하나씩 yield 하면 InferStack이 SSE 스트리밍 / 과금 / 로깅을 처리합니다
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

export const REQUIREMENTS_TEMPLATE = `# InferStack 베이스 이미지에 포함되지 않은 의존성만 기재하세요
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
