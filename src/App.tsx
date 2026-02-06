import { FileUpload } from './components/FileUpload';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Invoice Due Date Processor
          </h1>
          <p className="text-lg text-gray-600">
            Upload your CSV or Excel file to identify invoices due within 7 days
          </p>
        </div>

        <FileUpload />

        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">1</span>
              <span>Upload a CSV or Excel file containing invoice data with columns like Party Name, Bill No, Due Date, etc.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">2</span>
              <span>The file is automatically stored in Supabase Storage for record keeping.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">3</span>
              <span>Records with due dates within the next 7 days are extracted and displayed.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">4</span>
              <span>The JSON output can be used directly in n8n workflows for automation.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
