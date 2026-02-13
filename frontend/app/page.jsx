"use client";

import { useEffect, useMemo, useState } from "react";
import { getCompanies, getJob, uploadCsv } from "../lib/api";

export default function Page() {
  const [orgId, setOrgId] = useState("demo-org");
  const [file, setFile] = useState(null);
  const [job, setJob] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isFinished = useMemo(() => {
    if (!job) return false;
    return job.status === "done" || job.status === "failed";
  }, [job]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setMessage("Please choose a CSV file.");
      return;
    }

    setLoading(true);
    setMessage("");
    setCompanies([]);

    try {
      const nextJob = await uploadCsv(file, orgId);
      setJob(nextJob);
      setMessage("Upload accepted. Processing started.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!job || isFinished) return;

    const timer = setInterval(async () => {
      try {
        const latest = await getJob(job.id);
        setJob(latest);
      } catch {
        // keep polling on transient frontend errors
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [job, isFinished]);

  useEffect(() => {
    if (!job || !isFinished) return;

    getCompanies(job.id)
      .then(setCompanies)
      .catch(() => setMessage("Could not load enriched companies."));
  }, [job, isFinished]);

  return (
    <main>
      <h1>Outmate Mini GTM Enrichment</h1>
      <p>Upload a CSV with a <code>domain</code> column.</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input value={orgId} onChange={(e) => setOrgId(e.target.value)} placeholder="org id" />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile((e.target.files && e.target.files[0]) || null)}
            />
            <button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload CSV"}</button>
          </div>
        </form>
        {message ? <div className="status">{message}</div> : null}
      </div>

      {job ? (
        <div className="card">
          <h2>Job Status</h2>
          <p><strong>ID:</strong> {job.id}</p>
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Processed:</strong> {job.processed}/{job.total}</p>
          <p><strong>Failed:</strong> {job.failed}</p>
        </div>
      ) : null}

      {companies.length > 0 ? (
        <div className="card">
          <h2>Enriched Companies</h2>
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Industry</th>
                <th>Size</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.domain}</td>
                  <td>{company.industry || "-"}</td>
                  <td>{company.company_size || "-"}</td>
                  <td>{company.revenue_range || "-"}</td>
                  <td>{company.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
