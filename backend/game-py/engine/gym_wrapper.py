import gymnasium as gym
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import Tuple, Dict, Any, Optional

class GymEnvironment:
    def __init__(self, env_id: str, render_mode: str = 'rgb_array'):
        self.env_id = env_id
        self.env = gym.make(env_id, render_mode=render_mode)
        self.current_state = None
        self.done = False
        self.truncated = False
        
    def reset(self) -> Dict[str, Any]:
        observation, info = self.env.reset()
        self.current_state = observation
        self.done = False
        self.truncated = False
        frame = self._get_frame_base64()
        return {
            "observation": observation.tolist(),
            "info": info,
            "frame": frame,
            "render": {"mode": "frame", "frame": frame},
        }

    def step(self, action: int) -> Dict[str, Any]:
        if self.done or self.truncated:
            return self.reset()
            
        observation, reward, terminated, truncated, info = self.env.step(action)
        self.current_state = observation
        self.done = terminated
        self.truncated = truncated

        frame = self._get_frame_base64()
        
        return {
            "observation": observation.tolist(),
            "reward": float(reward),
            "done": terminated,
            "truncated": truncated,
            "info": info,
            "frame": frame,
            "render": {"mode": "frame", "frame": frame},
        }

    def _get_frame_base64(self) -> Optional[str]:
        try:
            frame = self.env.render()
            if frame is None:
                return None
            
            # Convert numpy array to image
            img = Image.fromarray(frame)
            
            # Save to buffer
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            
            # Encode
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            print(f"Error rendering frame: {e}")
            return None

    def close(self):
        self.env.close()
