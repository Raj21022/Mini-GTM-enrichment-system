const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadCsv(file, orgId) {
  const form = new FormData();
  form.append("file", file);
  form.append("org_id", orgId);

  const res = await fetch(`${API_URL}/api/v1/uploads`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${await res.text()}`);
  }

  return res.json();
}

export async function getJob(jobId) {
  const res = await fetch(`${API_URL}/api/v1/jobs/${jobId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }
  return res.json();
}

export async function getCompanies(jobId) {
  const res = await fetch(`${API_URL}/api/v1/jobs/${jobId}/companies`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch companies");
  }
  return res.json();
}
