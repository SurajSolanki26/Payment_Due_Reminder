# Setup Guide

## Environment Variables

### Frontend Setup

1. Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to Settings → API
- Copy the Project URL and anon/public key

### Backend Setup (Supabase Edge Function)

1. Ensure you have the Supabase CLI installed:
```bash
npm install -g supabase
```

2. Deploy the edge function:
```bash
supabase functions deploy process-file
```

3. Set environment variables for the edge function:
```bash
# For Supabase CLI
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get the Service Role Key from Supabase Dashboard → Settings → API (click on "Service role key" to reveal)

### Database Setup

1. Create the required storage bucket:
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `documents`
   - Uncheck "Make bucket public" (keep private)

2. Create the file_uploads table by running the migration:
```bash
supabase migration up
```

Or manually execute the migration SQL in the Supabase SQL editor.

## Troubleshooting

### Blank Page on File Upload

If you see a blank page when uploading:

1. **Check Browser Console** (F12):
   - Look for any error messages
   - Check for CORS errors

2. **Missing Environment Variables**:
   - Make sure `.env.local` file exists with VITE_SUPABASE_URL
   - Restart the dev server after creating .env.local

3. **Edge Function Not Deployed**:
   - Run `supabase functions list` to see deployed functions
   - If `process-file` is missing, deploy it: `supabase functions deploy process-file`

4. **Storage Bucket Missing**:
   - Check if the `documents` bucket exists in Supabase Storage
   - Create it if missing

5. **Database Table Missing**:
   - Ensure the `file_uploads` table exists
   - Run migrations if not created

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` in your browser.
