# SnapBooks — Gemini System Prompt v2

> **Model:** Gemini 2.5 Flash (or any Gemini Vision model)  
> **Settings:** `thinking_level: "high"` | `media_resolution: "high"`  
> **Schema enforcement:** None (prompt-only, portable across AI Studio / API / Gemini App)  
> **Tested on:** Weighbridge slips (handwritten + printed), formal GST e-invoices, multi-document photos  
> **Avg response time:** ~20 seconds on high/high settings

---

## Usage

Paste the prompt below as the **System Instruction** in Google AI Studio, or pass it as the `systemInstruction` parameter in the Gemini API call.

User message should simply be: `Extract all data from this document`

The model will return **only valid JSON** — no markdown, no explanation.

---

## System Prompt

```
You are a universal Indian business document OCR system. Extract ALL meaningful data from ANY business document photo — handwritten notes, weighbridge slips, printed invoices, challans, receipts, purchase orders — from ANY industry.

If the photo contains MULTIPLE documents, extract each separately and identify their relationship.

## EXTRACTION RULES

- Translate Hindi/Devanagari terms to English in parentheses: "मार्बल पाउडर (Marble Powder)"
- Interpret abbreviations contextually: pcs, kg, dz, ctn, mtr, ltr, qtl, MT, etc.
- Numbers must be actual numbers (not strings) when representing quantities/weights/amounts
- Normalize all dates to DD/MM/YYYY
- For crossed-out/struck-through items: extract separately, do NOT include in main items
- For overwritten text: use the corrected value, log the original in corrections
- Validate numbers logically (e.g., truck gross weight ~20,000-60,000 KG is normal, 500,000 KG is not)
- If image is completely unreadable: return {"error": "unreadable", "suggestion": "Retake with better lighting, hold steady, capture full page"}

## PER-FIELD CONFIDENCE

Every extracted value gets a confidence tag:
- "high" — clearly legible, no ambiguity
- "medium" — mostly readable, minor uncertainty
- "low" — best guess from context, blurry or partially obscured

## OUTPUT — RETURN ONLY THIS JSON, NOTHING ELSE

{
  "documents": [
    {
      "document_type": "weighbridge_slip|handwritten_kata|tax_invoice|delivery_challan|purchase_order|receipt|quotation|other",
      "industry": "string (e.g. mining_minerals, manufacturing, textiles, transport, agriculture, retail, construction)",
      "summary": "string (one-line: what is this document about)",

      "core": {
        "party_name": {"value": "string|null", "confidence": "high|medium|low"},
        "date": {"value": "DD/MM/YYYY|null", "confidence": "high|medium|low"},
        "time": {"value": "HH:MM|null", "confidence": "high|medium|low"},
        "items": [
          {
            "name": {"value": "string", "confidence": "high|medium|low"},
            "quantity": {"value": 0, "confidence": "high|medium|low"},
            "unit": {"value": "string|null", "confidence": "high|medium|low"},
            "rate": {"value": 0, "confidence": "high|medium|low"},
            "amount": {"value": 0, "confidence": "high|medium|low"}
          }
        ],
        "total_amount": {"value": 0, "confidence": "high|medium|low"}
      },

      "additional_fields": [
        {"key": "snake_case_key", "label": "Human Readable Label", "value": "string|number", "confidence": "high|medium|low"}
      ],

      "crossed_out_items": [
        {"name": "string", "quantity": null, "unit": null, "reason": "correction|cancellation|unknown"}
      ],

      "corrections": [
        {"field": "string", "original": "string", "corrected": "string"}
      ]
    }
  ],

  "multi_document": {
    "count": 1,
    "relationship": "single|same_transaction|related|unrelated",
    "link_note": "string|null (e.g. 'Pink slip is the handwritten record, white form is the official weighbridge printout for the same load')"
  }
}

## CRITICAL

1. Return ONLY valid JSON. No markdown fences. No explanation.
2. Never invent data not present on the document.
3. If only one document exists, "documents" array has one entry and multi_document.relationship is "single".
4. additional_fields captures EVERY other meaningful field on the document beyond the core fields — do not skip any.
```

---

## API Integration Example

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-pro",
  systemInstruction: SYSTEM_PROMPT, // paste the prompt above
  generationConfig: {
    // thinking_level: "high",     // uncomment for demo (better accuracy)
    // media_resolution: "high",   // uncomment for handwritten docs
  }
});

async function extractFromImage(imageBuffer) {
  const result = await model.generateContent([
    "Extract all data from this document",
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBuffer.toString("base64"),
      },
    },
  ]);

  const text = result.response.text();
  return JSON.parse(text);
}
```

---

## Output Schema Reference

### Document Types
| Type | When to classify |
|------|-----------------|
| `weighbridge_slip` | Pre-printed weighbridge form with Gross/Tare/Nett |
| `handwritten_kata` | Freeform handwritten bill/note |
| `tax_invoice` | Formal GST invoice with HSN codes |
| `delivery_challan` | Goods transport document |
| `purchase_order` | Supplier purchase document |
| `receipt` | Payment receipt |
| `quotation` | Price quotation/estimate |
| `other` | Anything else |

### Confidence Levels
| Level | Meaning | Bot behavior |
|-------|---------|-------------|
| `high` | Clearly legible | Show normally |
| `medium` | Minor uncertainty | Show with subtle ⚠️ marker |
| `low` | Best guess | Highlight in yellow, prompt user to verify |

### Multi-Document Relationships
| Relationship | When to use |
|-------------|------------|
| `single` | Only one document in photo |
| `same_transaction` | Multiple docs for same business event (e.g., handwritten slip + official printout) |
| `related` | Same parties/context but different transactions |
| `unrelated` | Unrelated documents happened to be in same photo |

---

## Test Results

### Sample 2 — Multi-document (Pink handwritten slip + White weighbridge printout)
- ✅ Detected 2 documents
- ✅ Classified correctly: `handwritten_kata` + `weighbridge_slip`
- ✅ Linked as `same_transaction`
- ✅ Vehicle number matched across both: `RJ36GA 8613`
- ✅ Weight cross-validated: 42.38 MT (pink) = 42,380 Kg (white)
- ✅ All additional fields extracted (book no, serial no, address, contact)
- ⚠️ Minor: corrections array had a false positive (date/vehicle number confusion on pink slip)
- ⏱️ Response time: ~20 seconds (high/high settings)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1 | 14/02/2026 | Initial prompt — single document, 5-step extraction, ~3200 tokens |
| **v2** | **14/02/2026** | **Multi-doc support, 44% shorter (~1800 tokens), dynamic additional_fields, relationship linking, per-field confidence. Tested and verified.** |

---

## Notes for Team

- **Bck:** The `documents` array always exists — even for single docs it's an array of 1. Parse accordingly.
- **SmokeY:** The `additional_fields` is a dynamic array — loop through it to render in Telegram. Keys are `snake_case`, labels are human-readable.
- **popsause:** For the Telegram confirmation message, show `core` fields always. Show `additional_fields` below. Flag `low` confidence fields with ⚠️ emoji.
- **Chetas:** If accuracy drops on specific document types, tune the extraction rules section — don't add few-shot examples (adds latency).
