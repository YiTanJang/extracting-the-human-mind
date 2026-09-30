"""Local development server: `python src/api/dev.py` (uses the venv in src/api/.venv).

Dev-only defaults: plain-http cookies, a throwaway admin token, docs enabled, a separate dev database.
"""

import os
from pathlib import Path

import uvicorn

os.chdir(Path(__file__).parent)
os.environ.setdefault("PILOT_COOKIE_SECURE", "false")
os.environ.setdefault("PILOT_ADMIN_TOKEN", "dev-admin")
os.environ.setdefault("PILOT_EXPOSE_DOCS", "true")
os.environ.setdefault("PILOT_DATABASE_URL", "sqlite:///./data/dev.db")

if __name__ == "__main__":
    uvicorn.run("app.asgi:app", host="127.0.0.1", port=8000)
