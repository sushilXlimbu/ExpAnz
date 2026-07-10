import requests
from datetime import datetime
from parse_hsbc import extract_transactions, PDF_PATH

API_URL = "https://localhost:7131/api/transactions/bulk"   # your .NET endpoint

SOURCE_BANK = "HSBC"


def to_api_format(txn):
    """Convert a parsed transaction into the JSON shape the .NET API expects."""
    # Parse "08 Apr 26" -> datetime -> ISO string
    dt = datetime.strptime(txn["date"], "%d %b %y")
    iso_date = dt.strftime("%Y-%m-%dT00:00:00")
    statement_month = dt.strftime("%Y-%m")   # e.g. "2026-04"

    return {
        "date": iso_date,
        "description": txn["description"],
        "amount": float(txn["amount"]),        # Decimal -> float for JSON
        "category": txn["category"],
        "merchant": txn["merchant"],
        "sourceBank": SOURCE_BANK,
        "statementMonth": statement_month,
        "fingerprint": ""                       # dedup comes later
    }


def main():
    txns = extract_transactions(PDF_PATH)
    payload = [to_api_format(t) for t in txns]

    print(f"Prepared {len(payload)} transactions. Sending to API...")

    # verify=False because it's a local dev HTTPS cert (same reason you turned
    # off SSL verification in Postman). Fine for localhost only.
    response = requests.post(API_URL, json=payload, verify=False)

    print(f"Status: {response.status_code}")
    if response.ok:
        print(f"Success! Inserted {len(payload)} transactions.")
    else:
        print("Error response:")
        print(response.text)


if __name__ == "__main__":
    main()