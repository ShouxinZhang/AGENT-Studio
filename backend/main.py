from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine.session_manager import session_manager
import uvicorn
import os

app = FastAPI(title="Agent Studio Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3115"],  # Allow Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GameStartRequest(BaseModel):
    env_id: str = "CartPole-v1"
    config: dict = None

class ActionRequest(BaseModel):
    action: int

@app.get("/")
async def root():
    return {"message": "Agent Studio Python Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# ===== Game API =====

@app.post("/api/game/start")
async def start_game(request: GameStartRequest):
    try:
        session_id = session_manager.create_session(request.env_id, request.config)
        session = session_manager.get_session(session_id)
        initial_state = session.reset()
        return {"session_id": session_id, "state": initial_state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/game/{session_id}/step")
async def game_step(session_id: str, request: ActionRequest):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        state = session.step(request.action)
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/game/{session_id}/reset")
async def game_reset(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        state = session.reset()
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/game/{session_id}")
async def end_game(session_id: str):
    session_manager.delete_session(session_id)
    return {"status": "success"}

# ===== WebSocket =====

@app.websocket("/ws/game")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_text(f"Agent received: {data}")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
