# Architecture Decisions

## 1. Idempotency on internal retries

## 2. Row limits on read tools

## 3. Write-scope safety

## 4. Per-call timeout

## 5. LLM provider & factory design
- **Decision:** Gemini (`gemini-3.1-flash-lite`, via the current `google-genai` SDK) is the only LLM provider actually wired up. Access goes through an `LLMProviderClient` abstract base plus a `get_llm_client(provider)` registry (`app/agent/llm_factory.py`), and `app/agent/llm_client.py`'s `call_llm(...)` is the only caller — it never talks to a provider SDK directly.
- **Alternatives considered:**
  - Hardcoding Anthropic, as the original scaffold draft listed — rejected: no key/requirement for it, and it would have meant shipping an untested integration.
  - Wiring up 2-3 providers (Gemini + Anthropic + OpenAI) up front — rejected as premature: without real keys for the others, that code would be unexercised and untested, adding risk without adding value.
  - A generic single `LLM_API_KEY` env var reused across whichever provider is active — rejected in favor of provider-specific key vars (`GEMINI_API_KEY`, etc.) so multiple providers can be configured side by side later without one overwriting another.
- **Rationale:** the factory/registry pattern keeps every call site (planner, loop controller) provider-agnostic — they only ever see `LLMResponse`/`LLMCallError`, never a provider SDK type. Adding a second provider later is a new `LLMProviderClient` subclass and one registry entry, not a change to any existing call site. Gemini's cheapest current GA tier (`gemini-3.1-flash-lite`, $0.25 / $1.50 per 1M tokens) was chosen to minimize `cost_usd` for a latency- and cost-sensitive tool-calling loop.
