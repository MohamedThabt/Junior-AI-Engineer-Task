from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config.exceptions import register_exception_handlers
from config.limiter import limiter
from config.logger import setup_logging
from config.middleware import RequestLoggingMiddleware
from config.settings import settings
from routes.api import router as api_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic placeholder
    yield
    # Shutdown logic placeholder


_is_production = settings.app_env.lower() == "production"
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "API is running"}
