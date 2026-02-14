import asyncio
import inspect
from collections.abc import Callable
from pathlib import Path

from google.genai.types import (
    AutomaticFunctionCallingConfig,
    Content,
    FunctionDeclaration,
    GenerateContentConfig,
    Part,
    Tool,
)
from pydantic import BaseModel

from src.config import MAX_API_CALLS, SYSTEM_PROMPT_PATH
from src.logger import log
from src.models import ChatHistory, GeminiModel, Role, ToolResponse
from src.agent.tools.generate_invoice import generate_invoice_pdf
from src.agent.tools.google_search_agent import google_search_agent


# ── Tool introspection ───────────────────────────────────────────────────────


def get_request_model(func: Callable) -> type[BaseModel] | None:
    """Extract the Pydantic request model from a tool function's type hints."""
    sig = inspect.signature(func)
    for param in sig.parameters.values():
        if param.annotation != inspect.Parameter.empty:
            param_type = param.annotation
            origin = getattr(param_type, "__origin__", None)
            if origin is not None:
                args = getattr(param_type, "__args__", ())
                for arg in args:
                    if arg is not type(None) and inspect.isclass(arg) and issubclass(arg, BaseModel):
                        return arg
            elif inspect.isclass(param_type) and issubclass(param_type, BaseModel):
                return param_type
    return None


# ── Schema resolution ────────────────────────────────────────────────────────


def _resolve_pydantic_schema(model: type[BaseModel]) -> dict:
    """Resolve $refs and anyOf in Pydantic JSON schema for Gemini API compatibility."""
    schema = model.model_json_schema()
    defs = schema.pop("$defs", {})

    def resolve(obj):
        if isinstance(obj, dict):
            if "$ref" in obj:
                ref_name = obj["$ref"].split("/")[-1]
                return resolve(defs[ref_name])

            if "anyOf" in obj:
                non_null = [t for t in obj["anyOf"] if t != {"type": "null"}]
                if len(non_null) == 1:
                    resolved = resolve(non_null[0])
                    for key in ("description", "default"):
                        if key in obj:
                            resolved[key] = obj[key]
                    resolved["nullable"] = True
                    return resolved

            return {k: resolve(v) for k, v in obj.items() if k != "title"}

        if isinstance(obj, list):
            return [resolve(item) for item in obj]

        return obj

    resolved = resolve(schema)
    resolved.pop("title", None)
    return resolved


# ── Tools registry ───────────────────────────────────────────────────────────


class Tools:
    def __init__(self):
        self.tool_funcs: list[Callable] = [
            generate_invoice_pdf,
            google_search_agent,
        ]
        self.callable_map = {func.__name__: func for func in self.tool_funcs}

    def build_declarations(self, model_map: dict[str, type[BaseModel] | None]) -> Tool:
        """Build Gemini Tool with manually resolved function declarations."""
        declarations = []
        for func in self.tool_funcs:
            name = func.__name__
            request_model = model_map.get(name)

            if request_model:
                params = _resolve_pydantic_schema(request_model)
            else:
                params = {"type": "object", "properties": {}}

            declarations.append(FunctionDeclaration(
                name=name,
                description=func.__doc__ or "",
                parameters=params,
            ))

        return Tool(function_declarations=declarations)


# ── Agent ────────────────────────────────────────────────────────────────────


class SnapBooksAgent:
    def __init__(self, model: GeminiModel = GeminiModel.FLASH):
        self.model = model
        self.model_id = model.value.id
        self.model_card = model.value

        self.client = GeminiModel.get_client()
        self.tools_manager = Tools()
        self.callable_map = self.tools_manager.callable_map

        self.model_map = {
            name: get_request_model(func)
            for name, func in self.callable_map.items()
            if get_request_model(func) is not None
        }

        self.system_instruction = self._load_system_instruction()
        self.tool_declarations = self.tools_manager.build_declarations(self.model_map)

        self.generation_config = GenerateContentConfig(
            system_instruction=self.system_instruction,
            tools=[self.tool_declarations],
            automatic_function_calling=AutomaticFunctionCallingConfig(disable=True),
        )

    def _load_system_instruction(self) -> Content:
        with open(SYSTEM_PROMPT_PATH) as f:
            prompt_text = f.read()

        parts = [Part.from_text(text=prompt_text)]

        example_image_path = Path(SYSTEM_PROMPT_PATH).parent / "examples" / "example_invoice.jpg"
        if example_image_path.exists():
            image_bytes = example_image_path.read_bytes()
            parts.append(Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
            parts.append(Part.from_text(
                text="Above is the example invoice format. Generate PDFs matching this professional layout."
            ))
            log("example_image_loaded", path=str(example_image_path))

        return Content(parts=parts)

    async def generate_response(self, chat_history: ChatHistory) -> ChatHistory:
        """Run the agent loop on a ChatHistory. Returns updated ChatHistory.

        The last message in chat_history.messages should be a USER message.
        The agent will keep looping until the model produces a final text response.
        """
        api_call_count = 0

        while chat_history.messages[-1].role != Role.MODEL:
            if api_call_count >= MAX_API_CALLS:
                log("max_api_calls_reached", limit=MAX_API_CALLS)
                chat_history.messages.append(
                    Content(
                        role=Role.MODEL.value,
                        parts=[Part.from_text(text="Maximum processing steps reached. Please try again.")],
                    )
                )
                break

            api_call_count += 1

            response = await self.client.models.generate_content(
                model=self.model_id,
                contents=chat_history.messages,
                config=self.generation_config,
            )

            if (
                not response.candidates
                or not response.candidates[0].content
                or not response.candidates[0].content.parts
            ):
                chat_history.messages.append(
                    Content(
                        role=Role.MODEL.value,
                        parts=[Part.from_text(text="Could not process that. Please try with a clearer photo.")],
                    )
                )
                break

            # Track token usage
            if response.usage_metadata:
                chat_history.add_api_call(response.usage_metadata, self.model_card)
                prompt_tokens = response.usage_metadata.prompt_token_count or 0
                candidates_tokens = response.usage_metadata.candidates_token_count or 0
                total_tokens = response.usage_metadata.total_token_count or 0
                log(
                    "api_call",
                    call=api_call_count,
                    input_tokens=prompt_tokens,
                    output_tokens=candidates_tokens,
                    total_tokens=total_tokens,
                )

            model_content = response.candidates[0].content
            chat_history.messages.append(model_content)

            # Collect function calls
            function_calls: list[tuple[str, dict]] = []
            for part in model_content.parts:
                if part.function_call:
                    function_calls.append(
                        (part.function_call.name, part.function_call.args)
                    )

            # No function calls → model is done, loop exits via role check
            if not function_calls:
                break

            # Execute tools in parallel
            tasks = [
                asyncio.create_task(self._execute_tool(name, args))
                for name, args in function_calls
            ]
            results = await asyncio.gather(*tasks)

            # Feed tool results back as USER message
            response_parts = [
                Part.from_function_response(
                    name=function_calls[i][0],
                    response={"content": results[i].response},
                )
                for i in range(len(results))
            ]
            chat_history.messages.append(Content(role=Role.USER.value, parts=response_parts))

        return chat_history

    async def _execute_tool(self, function_name: str, function_args: dict) -> ToolResponse:
        """Execute a registered tool by name."""
        try:
            log("tool_executing", tool=function_name)
            callable_fn = self.callable_map[function_name]
            request_model = self.model_map.get(function_name)
            args = function_args.get("request", function_args)

            if request_model is None:
                return await callable_fn()
            return await callable_fn(request_model(**args))
        except KeyError:
            return ToolResponse(response=f"Tool '{function_name}' not found.", status="error")
        except Exception as e:
            log("tool_error", tool=function_name, error=str(e))
            return ToolResponse(response=f"Error in {function_name}: {e}", status="error")
