import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface DueRecord {
  party_name: string;
  bill_no: string;
  bill_date: string;
  due_date: string;
  bill_amount: string;
  days_left: number;
  party_gstin?: string;
}

interface ProcessResponse {
  status: string;
  file_stored: boolean;
  storage_path: string;
  due_records: DueRecord[];
}

interface ErrorResponse {
  status: string;
  message: string;
}

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = /\.(csv|xlsx|xls)$/i;

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(validExtensions)) {
      setError('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        setError('Supabase URL not configured. Please set VITE_SUPABASE_URL in .env.local');
        setLoading(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/process-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError(
            'Edge Function not found. Please deploy the function first. See DEPLOYMENT.md for instructions.'
          );
        } else {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          setError(errorData.message || `Upload failed with status ${response.status}`);
        }
        setLoading(false);
        return;
      }

      const data: ProcessResponse | ErrorResponse = await response.json();

      if (data.status === 'error') {
        setError((data as ErrorResponse).message);
      } else {
        setResult(data as ProcessResponse);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Upload error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            disabled={loading}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <FileSpreadsheet className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {file ? file.name : 'Drop your file here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: CSV, Excel (.csv, .xlsx, .xls)
            </p>
          </label>
        </div>

        {file && !loading && (
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Process File
          </button>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 text-blue-600 py-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Processing your file...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">File Processed Successfully</p>
                <p className="text-green-700 text-sm">
                  Found {result.due_records.length} records due within 7 days
                </p>
              </div>
            </div>

            {result.due_records.length > 0 && (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Party Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Bill No</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Bill Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Days Left</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.due_records.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{record.party_name}</td>
                          <td className="px-4 py-3 text-gray-900">{record.bill_no}</td>
                          <td className="px-4 py-3 text-gray-600">{record.bill_date}</td>
                          <td className="px-4 py-3 text-gray-600">{record.due_date}</td>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {formatCurrency(record.bill_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                record.days_left < 0
                                  ? 'bg-red-100 text-red-700'
                                  : record.days_left <= 3
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {record.days_left < 0
                                ? `${Math.abs(record.days_left)} days overdue`
                                : record.days_left === 0
                                ? 'Due today'
                                : `${record.days_left} days`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Storage Path:</span> {result.storage_path}
              </p>
            </div>
          </div>
        )}
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">JSON Output for n8n:</p>
          <pre className="text-xs bg-white p-4 rounded border border-gray-200 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
