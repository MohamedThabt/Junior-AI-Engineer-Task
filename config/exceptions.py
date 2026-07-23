from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse

from config.logger import get_logger

logger = get_logger()


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    rid = _request_id(request)
    logger.warning(
        "HTTPException %s: %s",
        exc.status_code,
        exc.detail,
        extra={"request_id": rid, "method": request.method, "path": request.url.path, "status_code": exc.status_code},
    )
    body: dict = {"detail": exc.detail}
    if rid:
        body["request_id"] = rid
    return JSONResponse(status_code=exc.status_code, content=body)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    rid = _request_id(request)
    logger.warning(
        "Validation error",
        extra={"request_id": rid, "method": request.method, "path": request.url.path, "status_code": 422},
    )
    body: dict = {"detail": exc.errors()}
    if rid:
        body["request_id"] = rid
    return JSONResponse(status_code=422, content=body)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = _request_id(request)
    logger.error(
        "Unhandled exception: %s",
        str(exc),
        exc_info=True,
        extra={"request_id": rid, "method": request.method, "path": request.url.path, "status_code": 500},
    )
    body: dict = {"detail": "Internal server error"}
    if rid:
        body["request_id"] = rid
    return JSONResponse(status_code=500, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
