"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { uploadCsv, getJob, getCompanies } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useEnrichmentStore } from "../store/use-enrichment-store";

export default function Page() {
  const { orgId, selectedFile, jobId, message, setOrgId, setSelectedFile, setJobId, setMessage, resetAfterUpload } =
    useEnrichmentStore();

  const uploadMutation = useMutation({
    mutationFn: () => uploadCsv(selectedFile, orgId),
    onMutate: () => {
      resetAfterUpload();
      setMessage("");
    },
    onSuccess: (job) => {
      setJobId(job.id);
      setMessage("Upload accepted. Processing started.");
    },
    onError: (err) => {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    },
  });

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "done" || status === "failed") return false;
      return 2000;
    },
  });

  const isFinished = useMemo(() => {
    const status = jobQuery.data?.status;
    return status === "done" || status === "failed";
  }, [jobQuery.data?.status]);

  const companiesQuery = useQuery({
    queryKey: ["companies", jobId],
    queryFn: () => getCompanies(jobId),
    enabled: Boolean(jobId) && isFinished,
  });

  function onSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setMessage("Please choose a CSV file.");
      return;
    }
    uploadMutation.mutate();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-12 pt-10 md:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Outmate Mini GTM Enrichment</h1>
        <p className="mt-2 text-sm text-muted-foreground">Upload a CSV file with a <code>domain</code> column.</p>
      </div>

      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-center">
              <Input value={orgId} onChange={(e) => setOrgId(e.target.value)} placeholder="org id" />
              <Input type="file" accept=".csv" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      {jobQuery.data ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">ID:</span> {jobQuery.data.id}</p>
            <p>
              <span className="mr-2 font-medium">Status:</span>
              <Badge status={jobQuery.data.status}>{jobQuery.data.status}</Badge>
            </p>
            <p><span className="font-medium">Processed:</span> {jobQuery.data.processed}/{jobQuery.data.total}</p>
            <p><span className="font-medium">Failed:</span> {jobQuery.data.failed}</p>
          </CardContent>
        </Card>
      ) : null}

      {companiesQuery.data?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Enriched Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesQuery.data.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.domain}</TableCell>
                    <TableCell>{company.industry || "-"}</TableCell>
                    <TableCell>{company.company_size || "-"}</TableCell>
                    <TableCell>{company.revenue_range || "-"}</TableCell>
                    <TableCell><Badge status={company.status}>{company.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
