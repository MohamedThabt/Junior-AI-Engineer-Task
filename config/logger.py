import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from config.settings import settings

LOG_DIR = Path(__file__).resolve().parent.parent / "logs"


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
        }
        # Attach any extra context passed via the `extra` kwarg
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            value = getattr(record, key, None)
            if value is not None:
                entry[key] = value

        if record.exc_info and record.exc_info[0] is not None:
            entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(entry, default=str)


def setup_logging() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    formatter = JSONFormatter()

    file_handler = logging.FileHandler(LOG_DIR / "app.log", encoding="utf-8")
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger("app")
    logger.setLevel(settings.log_level)
    logger.handlers.clear()
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)


def get_logger() -> logging.Logger:
    return logging.getLogger("app")
