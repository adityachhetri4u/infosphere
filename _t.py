import httpx, io, sys

# Minimal valid PDF with real readable text
pdf_content = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 300 >> stream
BT
/F1 14 Tf
50 750 Td
(ENVIRONMENTAL PROTECTION POLICY 2025) Tj
0 -30 Td
(Section 1: All citizens must comply with waste management rules.) Tj
0 -20 Td
(Section 2: Businesses shall reduce carbon emissions by 30 percent.) Tj
0 -20 Td
(Section 3: Government shall provide funding for green initiatives.) Tj
0 -20 Td
(This policy is effective within 180 days of enactment.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000617 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
698
%%EOF"""

print("Testing PDF upload endpoint ...")
try:
    with httpx.Client(timeout=30) as client:
        r = client.post(
            "http://localhost:8001/api/v1/policy/summarize",
            files={"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")},
            headers={"Origin": "http://localhost:3000"},
        )
    print(f"HTTP Status: {r.status_code}")
    d = r.json()
    print(f"success: {d.get('success')}")
    print(f"summary: {str(d.get('summary',''))[:200]}")
    print(f"key_points: {len(d.get('key_points', []))} items")
    print(f"method: {d.get('metadata',{}).get('processing_method')}")
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
