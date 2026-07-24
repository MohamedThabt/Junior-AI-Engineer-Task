"""Gradio Blocks UI for the AI Excel Assistant.

This UI provides session management and checks API health on load.
"""

import gradio as gr
from ui.api_client import get_health, get_sessions, create_session, delete_session

def _check_health() -> tuple[str, bool]:
    """Query the backend health route and return status + boolean flag."""
    result = get_health()
    if result["ok"]:
        status = result["data"].get("status", "unknown")
        return f"✅ **API is healthy** — status: `{status}`", True
    return f"❌ **API unreachable** — {result['error']}", False

def _fetch_sessions() -> list[list[str]]:
    """Fetch sessions and return them as a list of lists for a dataframe."""
    res = get_sessions()
    if res["ok"]:
        return [[s["id"], s["session_name"], s["created_at"]] for s in res["data"]]
    return []

def _create_session_handler(name: str):
    if not name.strip():
        return "Please enter a session name.", _fetch_sessions()
    res = create_session(name.strip())
    if not res["ok"]:
        return f"Error: {res['error']}", _fetch_sessions()
    return f"Session '{name}' created successfully.", _fetch_sessions()

def _delete_session_handler(session_id: str):
    if not session_id:
        return "No session selected.", _fetch_sessions()
    res = delete_session(session_id)
    if not res["ok"]:
        return f"Error: {res['error']}", _fetch_sessions()
    return f"Session {session_id} deleted successfully.", _fetch_sessions()

def build_ui() -> gr.Blocks:
    """Build and return the Gradio Blocks app."""
    
    with gr.Blocks(title="AI Excel Assistant") as demo:
        gr.Markdown("# AI Excel Assistant")
        
        status_output = gr.Markdown(label="API Status")
        
        with gr.Row() as main_layout:
            # Sidebar for session list
            with gr.Column(scale=1):
                gr.Markdown("### Sessions")
                refresh_btn = gr.Button("Refresh Sessions", size="sm")
                
                # Using a Dataframe to list sessions (ID, Name, Created At)
                sessions_df = gr.Dataframe(
                    headers=["ID", "Name", "Created At"],
                    interactive=False,
                    wrap=True
                )
                
                gr.Markdown("#### Delete Session")
                del_session_id = gr.Textbox(label="Session ID to Delete")
                delete_btn = gr.Button("Delete Selected", variant="stop")
                delete_msg = gr.Markdown()
                
            # Main area for session creation
            with gr.Column(scale=3):
                gr.Markdown("### Create New Session")
                new_session_name = gr.Textbox(label="Session Name", placeholder="Enter new session name...")
                create_btn = gr.Button("Create Session", variant="primary")
                create_msg = gr.Markdown()
                
        def on_load():
            status_msg, is_healthy = _check_health()
            if is_healthy:
                sessions = _fetch_sessions()
                return status_msg, sessions, gr.update(visible=True)
            else:
                return status_msg, [], gr.update(visible=False)

        # On load, check health and populate sessions, show/hide main layout
        demo.load(
            fn=on_load,
            inputs=None,
            outputs=[status_output, sessions_df, main_layout]
        )
        
        refresh_btn.click(
            fn=_fetch_sessions,
            inputs=None,
            outputs=sessions_df
        )
        
        create_btn.click(
            fn=_create_session_handler,
            inputs=new_session_name,
            outputs=[create_msg, sessions_df]
        )
        
        delete_btn.click(
            fn=_delete_session_handler,
            inputs=del_session_id,
            outputs=[delete_msg, sessions_df]
        )
        
    return demo
