from starlette.datastructures import Headers
from starlette.responses import JSONResponse
from starlette.types import (
    ASGIApp,
    Message,
    Receive,
    Scope,
    Send,
)


class RequestBodyTooLargeError(Exception):
    """เกิดขึ้นเมื่อ HTTP request body ใหญ่เกินกำหนด."""


class RequestBodyLimitMiddleware:
    """
    จำกัดขนาด HTTP Request ก่อนที่ FastAPI
    จะ Parse multipart/form-data

    ตรวจจาก:
    1. Content-Length Header
    2. จำนวน bytes ที่รับจริงจาก ASGI receive
    """

    def __init__(
        self,
        app: ASGIApp,
        *,
        max_body_size: int,
        protected_paths: set[str] | None = None,
        protected_methods: set[str] | None = None,
    ) -> None:
        if max_body_size <= 0:
            raise ValueError(
                "max_body_size must be greater than zero"
            )

        self.app = app
        self.max_body_size = max_body_size

        self.protected_paths = frozenset(
            protected_paths
            or {
                "/api/predict",
                "/api/predict/",
            }
        )

        self.protected_methods = frozenset(
            method.upper()
            for method in (
                protected_methods
                or {"POST"}
            )
        )

    def should_limit_request(
        self,
        scope: Scope,
    ) -> bool:
        if scope["type"] != "http":
            return False

        method = str(
            scope.get("method", "")
        ).upper()

        path = str(
            scope.get("path", "")
        )

        return (
            method in self.protected_methods
            and path in self.protected_paths
        )

    def get_content_length(
        self,
        scope: Scope,
    ) -> int | None:
        headers = Headers(scope=scope)

        content_length_value = headers.get(
            "content-length"
        )

        if content_length_value is None:
            return None

        try:
            content_length = int(
                content_length_value
            )
        except ValueError:
            return None

        if content_length < 0:
            return None

        return content_length

    async def send_too_large_response(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        limit_mib = (
            self.max_body_size
            / (1024 * 1024)
        )

        response = JSONResponse(
            status_code=413,
            content={
                "detail": (
                    "Request body exceeds "
                    f"the {limit_mib:g} MiB limit"
                )
            },
        )

        await response(
            scope,
            receive,
            send,
        )

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if not self.should_limit_request(
            scope
        ):
            await self.app(
                scope,
                receive,
                send,
            )
            return

        # ตรวจ Content-Length ก่อน
        content_length = (
            self.get_content_length(scope)
        )

        if (
            content_length is not None
            and content_length
            > self.max_body_size
        ):
            await self.send_too_large_response(
                scope,
                receive,
                send,
            )
            return

        received_body_size = 0
        response_started = False

        async def limited_receive() -> Message:
            nonlocal received_body_size

            message = await receive()

            if message["type"] == "http.request":
                body_chunk = message.get(
                    "body",
                    b"",
                )

                received_body_size += len(
                    body_chunk
                )

                if (
                    received_body_size
                    > self.max_body_size
                ):
                    raise (
                        RequestBodyTooLargeError
                    )

            return message

        async def tracked_send(
            message: Message,
        ) -> None:
            nonlocal response_started

            if (
                message["type"]
                == "http.response.start"
            ):
                response_started = True

            await send(message)

        try:
            await self.app(
                scope,
                limited_receive,
                tracked_send,
            )

        except RequestBodyTooLargeError:
            # ปกติ Request จะถูกปฏิเสธ
            # ก่อนเริ่ม Response
            if response_started:
                raise

            await self.send_too_large_response(
                scope,
                receive,
                send,
            )