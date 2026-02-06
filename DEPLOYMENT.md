# Deployment Guide - Edge Function Setup

## ⚠️ IMPORTANT: The Function Must Be Deployed

The app requires deploying the `process-file` Edge Function to Supabase. Without this, you'll get "Function not found" errors.

## Deployment Steps

### 1. Get Your Project Details

First, find your Supabase project ID:
- Go to https://supabase.com/dashboard
- Select your project
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
- Copy `YOUR_PROJECT_ID`

Also get your Service Role Key:
- Dashboard → Settings → API
- Scroll down to "Service role key" section
- Click to reveal the key and copy it

### 2. Install Supabase CLI

**Windows (PowerShell):**
```powershell
# Download and extract
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/download/v1.193.2/supabase_1.193.2_windows_amd64.zip" -OutFile "supabase.zip"
Expand-Archive -Path "supabase.zip" -DestinationPath "."
```

Or download manually from: https://github.com/supabase/cli/releases

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

### 3. Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. Click "Confirm" when prompted.

### 4. Link Your Project

```bash
# In your project directory
supabase link --project-id YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual project ID from step 1.

### 5. Deploy the Function

```bash
supabase functions deploy process-file
```

You should see output like:
```
✓ Function process-file deployed successfully
```

### 6. Set Environment Secrets

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Replace:
- `YOUR_PROJECT_ID` with your project ID
- `YOUR_SERVICE_ROLE_KEY` with the key from step 1

### Verify Deployment

```bash
supabase functions list
```

You should see `process-file` in the list.

## Troubleshooting Deployment

**Error: "Project not linked"**
```bash
supabase link --project-id YOUR_PROJECT_ID
```

**Error: "Not authenticated"**
```bash
supabase login
```

**Function still shows "not found"**
- Wait 30 seconds for propagation
- Hard refresh browser (Ctrl+Shift+R)
- Check deployment logs:
  ```bash
  supabase functions list
  supabase functions get-config process-file
  ```

**Can't find CLI download**
- Visit https://github.com/supabase/cli/releases
- Download the Windows .zip file
- Extract and add to PATH

## Alternative: Deploy via Dashboard

If CLI doesn't work:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions**
4. Click **Create a new function**
5. Name: `process-file`
6. Language: TypeScript
7. Copy entire code from `supabase/functions/process-file/index.ts`
8. Click **Deploy**
9. Go to **Settings** → Add Secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Next Steps

After deployment:
1. Make sure `.env.local` is created with your Supabase credentials
2. Create the `documents` storage bucket in Supabase
3. Run database migrations or create the `file_uploads` table
4. Restart your dev server
5. Upload a test file
