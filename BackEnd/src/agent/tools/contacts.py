from pydantic import BaseModel, Field

from src.firebase import get_db
from src.logger import log
from src.models import Contact, ToolResponse


class LookupContactsRequest(BaseModel):
    query: str = Field(..., description="Search query to match against contact names (partial match supported)")
    metadata: bool = Field(
        False,
        description="If false, return only names and IDs. If true, return full details (address, GSTIN, phone, etc.)",
    )


async def lookup_contacts(request: LookupContactsRequest) -> ToolResponse:
    """Search contacts by name. Set metadata=true to get full details (address, GSTIN, phone), or false for just names and IDs."""
    try:
        db = get_db()
        docs = await db.collection("contacts").get()

        query_lower = request.query.lower()
        matches = []
        for doc in docs:
            data = doc.to_dict()
            name = data.get("name", "")
            if query_lower in name.lower():
                if request.metadata:
                    matches.append(Contact(contact_id=doc.id, **data).model_dump(exclude_none=True))
                else:
                    matches.append({"contact_id": doc.id, "name": name})

        log("lookup_contacts", query=request.query, metadata=request.metadata, results=len(matches))
        if not matches:
            return ToolResponse(response=f"No contacts found matching '{request.query}'.")
        return ToolResponse(response=matches)
    except Exception as e:
        log("lookup_contacts_error", error=str(e))
        return ToolResponse(response=f"Error looking up contacts: {e}", status="error")
