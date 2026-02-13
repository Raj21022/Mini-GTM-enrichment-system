import hashlib

import httpx

from app.core.config import settings


class ExploriumClient:
    def __init__(self) -> None:
        self.base_url = settings.explorium_base_url.rstrip("/")
        self.match_path = "/" + settings.explorium_match_path.strip("/")
        self.enrich_path = "/" + settings.explorium_enrich_path.strip("/")
        self.api_key = settings.explorium_api_key

    def enrich(self, domain: str) -> dict[str, str]:
        if not self.api_key:
            return self._fake_enrichment(domain)

        headers = {
            "api_key": self.api_key,
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=20) as client:
            business_id = self._match_business_id(client, headers, domain)
            if not business_id:
                raise RuntimeError(f"Explorium match failed for domain: {domain}")

            body = self._firmographics_enrich(client, headers, business_id)

        data = body.get("data") if isinstance(body, dict) else None
        if not isinstance(data, dict):
            raise RuntimeError("Explorium enrich returned unexpected response format")

        return {
            "industry": data.get("naics_description") or data.get("sic_code_description") or "Unknown",
            "company_size": data.get("company_size") or data.get("number_of_employees_range") or "Unknown",
            "revenue_range": data.get("company_revenue") or data.get("revenue_range") or "Unknown",
        }

    def _match_business_id(self, client: httpx.Client, headers: dict[str, str], domain: str) -> str | None:
        url = f"{self.base_url}{self.match_path}"
        payload = {
            "businesses_to_match": [
                {
                    "domain": domain,
                }
            ],
            "request_context": None,
        }

        response = client.post(url, json=payload, headers=headers)
        if response.status_code >= 400:
            detail = response.text[:500]
            raise RuntimeError(f"Explorium match API failed ({response.status_code}) at {url}: {detail}")

        body = response.json()
        matches = body.get("matched_businesses") if isinstance(body, dict) else None
        if not isinstance(matches, list) or not matches:
            return None

        first = matches[0]
        if not isinstance(first, dict):
            return None

        return first.get("business_id")

    def _firmographics_enrich(
        self,
        client: httpx.Client,
        headers: dict[str, str],
        business_id: str,
    ) -> dict:
        url = f"{self.base_url}{self.enrich_path}"
        payload = {
            "business_id": business_id,
            "request_context": None,
            "parameters": {},
        }

        response = client.post(url, json=payload, headers=headers)
        if response.status_code >= 400:
            detail = response.text[:500]
            raise RuntimeError(f"Explorium enrich API failed ({response.status_code}) at {url}: {detail}")

        return response.json()

    def _fake_enrichment(self, domain: str) -> dict[str, str]:
        industries = ["SaaS", "Fintech", "Healthcare", "Ecommerce"]
        sizes = ["1-10", "11-50", "51-200", "201-1000"]
        revenue = ["<1M", "1M-10M", "10M-50M", "50M+"]

        index = int(hashlib.sha1(domain.encode("utf-8")).hexdigest(), 16)
        return {
            "industry": industries[index % len(industries)],
            "company_size": sizes[index % len(sizes)],
            "revenue_range": revenue[index % len(revenue)],
        }
