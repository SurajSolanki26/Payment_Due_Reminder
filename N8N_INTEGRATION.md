# n8n Integration Guide

This application processes invoice files (CSV/Excel) and identifies records with due dates within 7 days. It's designed to work seamlessly with n8n workflows.

## Architecture

1. **File Upload**: User uploads CSV or Excel file through the web interface
2. **Storage**: File is stored in Supabase Storage bucket named `documents`
3. **Processing**: Edge function parses the file and identifies due records
4. **Output**: Returns structured JSON ready for n8n automation

## API Endpoint

```
POST https://YOUR_SUPABASE_URL/functions/v1/process-file
```

### Request Format

Multipart form data with a single file field:

```
Content-Type: multipart/form-data

file: [CSV or Excel file]
```

### Response Format (Success)

```json
{
  "status": "success",
  "file_stored": true,
  "storage_path": "1738827600000_invoices.csv",
  "due_records": [
    {
      "party_name": "ABC Enterprises",
      "bill_no": "INV-001",
      "bill_date": "2026-01-15",
      "due_date": "2026-02-10",
      "bill_amount": "25000",
      "days_left": 4,
      "party_gstin": "29ABCDE1234F1Z5"
    }
  ]
}
```

### Response Format (Error)

```json
{
  "status": "error",
  "message": "Invalid file type. Only CSV and Excel files are allowed"
}
```

## n8n Workflow Setup

### Option 1: HTTP Request Node

1. Add an HTTP Request node
2. Configure:
   - **Method**: POST
   - **URL**: `https://YOUR_SUPABASE_URL/functions/v1/process-file`
   - **Body Content Type**: Multipart Form Data
   - **Body Parameters**:
     - Name: `file`
     - Type: `File`
     - Input Data Field Name: Your file input field

### Option 2: Webhook Trigger + HTTP Request

1. **Webhook Node** (Trigger)
   - Method: POST
   - Path: `/upload-invoice`
   - Response Mode: When Last Node Finishes

2. **HTTP Request Node**
   - Method: POST
   - URL: `https://YOUR_SUPABASE_URL/functions/v1/process-file`
   - Send File: Yes
   - Input Data Field Name: `file`

3. **Switch Node** (Check Status)
   - Mode: Rules
   - Rule 1: `{{ $json.status }} equals "success"`
   - Output: Continue to next nodes
   - Default: Error handling

4. **Code Node** (Process Records)
   ```javascript
   const records = $input.all()[0].json.due_records;
   return records.map(record => ({ json: record }));
   ```

## File Format Requirements

### Supported File Types
- CSV (.csv)
- Excel (.xlsx, .xls)

### Required Columns (flexible naming)

The system accepts variations of these column names:

| Column Purpose | Accepted Names |
|---------------|----------------|
| Party Name | party_name, partyname, party, name, customer |
| Bill Number | bill_no, billno, bill, invoice, invoiceno |
| Bill Date | bill_date, billdate, invoicedate, date |
| Due Date | due_date, duedate, due |
| Due Days | due_days, duedays, days |
| Bill Amount | bill_amount, billamount, amount, total |
| Party GSTIN | party_gstin, partygstin, gstin, gst (optional) |

### Date Formats Supported
- `YYYY-MM-DD` (2026-02-10)
- `DD/MM/YYYY` (10/02/2026)
- `DD-MM-YYYY` (10-02-2026)
- Excel date numbers (automatically converted)

### Due Logic

A record is considered "due" if:
- Due Date is within the next 7 days, OR
- Due Days value is ≤ 7

Records up to 30 days overdue are also included.

## Example n8n Workflows

### 1. Email Notification Workflow

```
Webhook Trigger → HTTP Request (Process File) → Switch (Check Status) →
Filter (Due Records) → Email (Send Reminders)
```

### 2. Slack Alert Workflow

```
Schedule Trigger → HTTP Request (Process File) → Code (Format Message) →
Slack (Post Message)
```

### 3. Multi-Channel Notification

```
HTTP Request (Process File) → Split in Batches →
├─ Email Node
├─ Slack Node
└─ SMS Node (Twilio)
```

## Sample CSV File

A sample file `sample_invoices.csv` is included in the project for testing.

## Testing with cURL

```bash
curl -X POST \
  https://YOUR_SUPABASE_URL/functions/v1/process-file \
  -F "file=@sample_invoices.csv"
```

## Error Handling

Common errors and solutions:

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "No file provided in request" | Missing file in form data | Ensure file field is named "file" |
| "Invalid file type" | Wrong file format | Use CSV or Excel files only |
| "File is empty or could not be parsed" | Corrupt or empty file | Check file contents |
| "Failed to upload file to storage" | Storage bucket issue | Verify bucket permissions |

## Storage Access

Files are stored in Supabase Storage and can be accessed:

```javascript
const { data } = await supabase
  .storage
  .from('documents')
  .download('STORAGE_PATH_FROM_RESPONSE');
```

## Database Tracking

All file uploads are tracked in the `file_uploads` table:

```sql
SELECT * FROM file_uploads
WHERE status = 'completed'
ORDER BY uploaded_at DESC;
```

## Security Notes

- The endpoint is public (no JWT verification required)
- Files are stored with timestamp prefixes to prevent conflicts
- RLS policies ensure secure access to storage
- Service role key is used internally for backend operations

## Next Steps

1. Copy your Supabase URL
2. Create an n8n workflow
3. Add HTTP Request node with the process-file endpoint
4. Configure subsequent nodes to handle the JSON output
5. Test with the sample CSV file

For support, refer to the Supabase and n8n documentation.
