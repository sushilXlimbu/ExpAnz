from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from datetime import datetime

from parse_hsbc import extract_transactions

app = FastAPI(title="Budget Parser Service")

# Allow the .NET API to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # local dev; tighten later
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_api_format(txn, source_bank="HSBC"):
    """Convert a parsed transaction into the JSON shape the .NET API expects."""
    dt = datetime.strptime(txn["date"], "%d %b %y")
    return {
        "date": dt.strftime("%Y-%m-%dT00:00:00"),
        "description": txn["description"],
        "amount": float(txn["amount"]),
        "category": txn["category"],
        "merchant": txn["merchant"],
        "sourceBank": source_bank,
        "statementMonth": dt.strftime("%Y-%m"),
        "fingerprint": "",
    }


@app.post("/parse")
async def parse_statement(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save the uploaded file to a temp location so pdfplumber can open it
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        txns = extract_transactions(tmp_path)
        payload = [to_api_format(t) for t in txns]

        # Reconciliation info returned so the caller can verify
        total_out = sum(t["amount"] for t in payload if t["amount"] < 0)
        total_in = sum(t["amount"] for t in payload if t["amount"] > 0)

        return {
            "count": len(payload),
            "totalOut": round(total_out, 2),
            "totalIn": round(total_in, 2),
            "transactions": payload,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)   # clean up — don't leave bank statements on disk