import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  FileCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const BulkCsvUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [nameCol, setNameCol] = useState('full_name');
  const [emailCol, setEmailCol] = useState('email');
  const [phoneCol, setPhoneCol] = useState('phone');
  const [cityCol, setCityCol] = useState('city');
  const [dateCol, setDateCol] = useState('date_created');

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Invalid file format. Please upload a standard .csv file.');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setDatasetName(selectedFile.name.replace('.csv', ''));
    setUploadResult(null);

    // Read first few lines for client preview & auto-column mapping
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 6);
      if (lines.length > 0) {
        const parsedRows = lines.map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
        const detectedHeaders = parsedRows[0];
        setHeaders(detectedHeaders);
        setCsvPreview(parsedRows.slice(1));

        // Auto map columns
        const lowerHeaders = detectedHeaders.map((h) => h.toLowerCase());
        const nIndex = lowerHeaders.findIndex((h) => ['full_name', 'name', 'fullname', 'person_name'].includes(h));
        if (nIndex !== -1) setNameCol(detectedHeaders[nIndex]);

        const eIndex = lowerHeaders.findIndex((h) => ['email', 'email_address', 'mail'].includes(h));
        if (eIndex !== -1) setEmailCol(detectedHeaders[eIndex]);

        const pIndex = lowerHeaders.findIndex((h) => ['phone', 'phone_number', 'mobile', 'tel'].includes(h));
        if (pIndex !== -1) setPhoneCol(detectedHeaders[pIndex]);

        const cIndex = lowerHeaders.findIndex((h) => ['city', 'location', 'town'].includes(h));
        if (cIndex !== -1) setCityCol(detectedHeaders[cIndex]);

        const dIndex = lowerHeaders.findIndex((h) => ['date_created', 'created_date', 'date', 'created_at'].includes(h));
        if (dIndex !== -1) setDateCol(detectedHeaders[dIndex]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (datasetName) formData.append('dataset_name', datasetName);
    formData.append('name_col', nameCol);
    if (emailCol) formData.append('email_col', emailCol);
    if (phoneCol) formData.append('phone_col', phoneCol);
    if (cityCol) formData.append('city_col', cityCol);
    if (dateCol) formData.append('date_col', dateCol);

    try {
      const result = await api.uploadCsv(formData);
      setUploadResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const loadSampleDataset = async () => {
    // Generate a demo synthetic CSV on the fly in browser memory
    const demoCsv = `full_name,email,phone,city,date_created,synthetic_label
Elena Rostova,elena.rostova@gmail.com,+1 202-555-0184,Seattle,2026-01-15,0
Test User,testuser@example.com,555-0100,Metropolis,2026-02-10,1
Kwame Mensah,kwame.mensah@outlook.com,+44 7911 123456,London,2026-02-20,0
Robert J. Miller99,bad-email-address,0000000000,Chicago,2026-03-01,1
Carlos Hernandez,carlos.h@gmail.com,+34 91 123 4567,Madrid,2026-03-05,0
Admin User,admin@mailinator.com,1234567890,New York,2026-03-12,1
Elena Rostova,elena.rostova@gmail.com,+1 202-555-0184,Seattle,2026-01-15,0`;

    const blob = new Blob([demoCsv], { type: 'text/csv' });
    const demoFile = new File([blob], 'demo_synthetic_batch.csv', { type: 'text/csv' });
    handleFileChange(demoFile);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bulk CSV Dataset Upload</h1>
          <p className="text-xs text-slate-400 mt-1">
            Batch ingest and analyze identity records with automated normalization, duplicate detection, and ML inference.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleDataset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Quick Sample CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Dropzone & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-brand-500 rounded-xl p-8 text-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all flex flex-col items-center justify-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-full mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {file ? file.name : 'Click to browse or drag & drop CSV'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Standard UTF-8 CSV up to 25MB</p>
              {file && (
                <span className="mt-2 text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>

            {/* Ingestion Settings */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Dataset Details &amp; Column Mapping
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dataset Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Synthetic Identity Test Run 1"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {headers.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Name Column <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={nameCol}
                      onChange={(e) => setNameCol(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Column</label>
                    <select
                      value={emailCol}
                      onChange={(e) => setEmailCol(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                    >
                      <option value="">(None)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Column</label>
                    <select
                      value={phoneCol}
                      onChange={(e) => setPhoneCol(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                    >
                      <option value="">(None)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">City Column</label>
                    <select
                      value={cityCol}
                      onChange={(e) => setCityCol(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                    >
                      <option value="">(None)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {uploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Processing &amp; Analyzing CSV Rows...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload &amp; Analyze Dataset</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results & CSV Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {uploadResult ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Batch Analysis Completed</h3>
                    <p className="text-xs text-slate-400 font-mono">Job ID: {uploadResult.job_id}</p>
                  </div>
                </div>
                <Badge status="COMPLETED" />
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Rows</span>
                  <div className="text-base font-bold text-white mt-0.5">{uploadResult.total_rows}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Valid Passed</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{uploadResult.valid_rows}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Flagged / Review</span>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{uploadResult.flagged_rows}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Duplicate Collisions</span>
                  <div className="text-base font-bold text-purple-400 mt-0.5">{uploadResult.duplicate_rows}</div>
                </div>
              </div>

              {uploadResult.failed_rows > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                  <strong>Notice:</strong> {uploadResult.failed_rows} row(s) had missing names or critical syntax issues
                  and were logged.
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">All records persisted to database.</span>
                <a
                  href="/records"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <span>Explore Ingested Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : csvPreview.length > 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-400" />
                  Client CSV Preview (First {csvPreview.length} rows)
                </h3>
                <span className="text-xs text-slate-500">{headers.length} columns detected</span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 border-b border-slate-800 font-mono text-[11px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {csvPreview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                            {cell || <span className="text-slate-600 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Dataset Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Choose a file or click "Load Quick Sample CSV" to test the ingestion pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
