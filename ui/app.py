"""Gradio Blocks UI for the AI Excel Assistant.

Initially this wires a single "Check API Health" action to the FastAPI
``/api/health`` route. It is intended as the seed UI that later grows into the
chat interface described in the technical spec.
"""

import gradio as gr

from ui.api_client import get_health


def _check_health() -> str:
    """Query the backend health route and format the result as Markdown."""
    result = get_health()
    if result["ok"]:
        data = result["data"]
        status = data.get("status", "unknown")
        return f"✅ **API is healthy** — status: `{status}`"
    return f"❌ **API unreachable** — {result['error']}"


def build_ui() -> gr.Blocks:
    """Build and return the Gradio Blocks app (not launched here).

    The app is mounted onto FastAPI in ``main.py`` so it starts with the server.
    """
    with gr.Blocks(title="AI Excel Assistant") as demo:
        gr.Markdown("# AI Excel Assistant")
        gr.Markdown(
            "Conversational assistant for Excel datasets. "
            "This starter UI verifies connectivity with the backend API."
        )

        with gr.Row():
            check_button = gr.Button("Check API Health", variant="primary")

        status_output = gr.Markdown(label="API Status")

        check_button.click(fn=_check_health, inputs=None, outputs=status_output)

        # Show the current health status as soon as the UI loads.
        demo.load(fn=_check_health, inputs=None, outputs=status_output)

    return demo
