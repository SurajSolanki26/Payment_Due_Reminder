/*
  # File Upload System Setup

  1. Storage
    - Create `documents` bucket for file storage
    - Enable public access for reading
    - Allow authenticated users to upload

  2. New Tables
    - `file_uploads`
      - `id` (uuid, primary key)
      - `file_name` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `status` (text)
      - `due_records_count` (integer)
      - `uploaded_at` (timestamp)
      - `processed_at` (timestamp)

  3. Security
    - Enable RLS on `file_uploads` table
    - Add policies for file operations
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create file_uploads tracking table
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  mime_type text,
  status text DEFAULT 'processing',
  due_records_count integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert file upload records
CREATE POLICY "Allow public file upload inserts"
  ON file_uploads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read file upload records
CREATE POLICY "Allow public file upload reads"
  ON file_uploads FOR SELECT
  TO anon
  USING (true);

-- Storage policies for documents bucket
CREATE POLICY "Allow public uploads to documents bucket"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public reads from documents bucket"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'documents');

CREATE POLICY "Allow public deletes from documents bucket"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'documents');