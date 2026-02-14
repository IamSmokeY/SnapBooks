from google.genai.types import (
    Content,
    GenerateContentConfig,
    GoogleSearch,
    Part,
    Tool,
)
from pydantic import BaseModel, Field

from src.models import GeminiModel, Role, ToolResponse
from src.logger import log

SYSTEM_PROMPT = (
    "You are a search assistant for an Indian accounting/invoicing app. "
    "Search for the requested information and return a concise, factual answer. "
    "Focus on current market rates, GST rates, HSN codes, and business information relevant to Indian SMBs."
)


class GoogleSearchRequest(BaseModel):
    search_query: str = Field(
        ...,
        description=(
            "A detailed Google search query. "
            "For market rates, include material name, location, and 'current rate per ton/kg'. "
            "For HSN codes, include item name and 'HSN code GST rate India'."
        ),
    )


async def google_search_agent(request: GoogleSearchRequest) -> ToolResponse:
    """Search Google for real-time information like current market rates, GST rates, HSN codes, or business details."""
    try:
        log("google_search_start", query=request.search_query)

        client = GeminiModel.get_client()
        model_id = GeminiModel.FLASH.value.id

        generation_config = GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[Tool(google_search=GoogleSearch())],
        )

        response = await client.models.generate_content(
            model=model_id,
            contents=[Content(role=Role.USER.value, parts=[Part.from_text(text=request.search_query)])],
            config=generation_config,
        )

        response_text = response.text

        log("google_search_complete", query=request.search_query, response_length=len(response_text or ""))

        return ToolResponse(
            response=response_text or "No results found.",
            status="success",
        )
    except Exception as e:
        log("google_search_error", query=request.search_query, error=str(e))
        return ToolResponse(
            response=f"Search failed: {e}",
            status="error",
        )
