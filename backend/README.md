# Agent Studio Backend

This is the Python backend for Agent Studio, designed to host Autonomous Agents and MCP (Model Context Protocol) servers.

## Setup

1.  **Create a virtual environment**:
    ```bash
    python3 -m venv venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Running

Start the development server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`.
API Documentation (Swagger UI) is at `http://localhost:8000/docs`.

## Structure

- `main.py`: Entry point and API routes.
- `agents/`: (Planned) Agent logic and LangGraph workflows.
- `games/`: (Planned) Game environments and logic.
- `mcp/`: (Planned) MCP server implementations.
