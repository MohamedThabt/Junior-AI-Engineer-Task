"""Gradio UI package for the AI Excel Assistant.

The Gradio Blocks app is mounted onto the FastAPI application in ``main.py``
via ``gradio.mount_gradio_app``, so it launches together with the API server.
"""

from ui.app import build_ui

__all__ = ["build_ui"]
