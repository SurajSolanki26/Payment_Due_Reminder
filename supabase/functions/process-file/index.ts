// @ts-expect-error - Deno npm: imports are valid in Deno runtime
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
// @ts-expect-error - Deno npm: imports are valid in Deno runtime
import * as XLSX from "npm:xlsx@0.18.5";

// Type declarations for Deno
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

function normalizeDate(dateValue: any): string {
  if (!dateValue) return "";

  if (typeof dateValue === "number") {
    const date = XLSX.SSF.parse_date_code(dateValue);
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }

  if (dateValue instanceof Date) {
    return dateValue.toISOString().split("T")[0];
  }

  const dateStr = String(dateValue).trim();
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year, month, day;
      if (format === formats[0]) {
        [, year, month, day] = match;
      } else {
        [, day, month, year] = match;
      }
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return dateStr;
}

function calculateDaysLeft(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function parseFile(fileBuffer: ArrayBuffer, mimeType: string): any[] {
  try {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse file: ${errorMessage}`);
  }
}

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function findColumnValue(row: any, possibleNames: string[]): any {
  for (const key of Object.keys(row)) {
    const normalized = normalizeColumnName(key);
    if (possibleNames.some(name => normalized.includes(name))) {
      return row[key];
    }
  }
  return null;
}

function processRecords(data: any[]): DueRecord[] {
  const dueRecords: DueRecord[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const row of data) {
    const partyName = findColumnValue(row, ["partyname", "party", "name", "customer"]);
    const billNo = findColumnValue(row, ["billno", "bill", "invoice", "invoiceno"]);
    const billDate = findColumnValue(row, ["billdate", "invoicedate", "date"]);
    const dueDate = findColumnValue(row, ["duedate", "due"]);
    const dueDays = findColumnValue(row, ["duedays", "days"]);
    const billAmount = findColumnValue(row, ["billamount", "amount", "total"]);
    const partyGstin = findColumnValue(row, ["partygstin", "gstin", "gst"]);

    if (!partyName || !billNo) continue;

    let normalizedDueDate = "";
    let daysLeft = 0;

    if (dueDate) {
      normalizedDueDate = normalizeDate(dueDate);
      daysLeft = calculateDaysLeft(normalizedDueDate);
    } else if (dueDays) {
      const days = parseInt(String(dueDays), 10);
      if (!isNaN(days)) {
        daysLeft = days;
        const dueDateObj = new Date(today);
        dueDateObj.setDate(dueDateObj.getDate() + days);
        normalizedDueDate = dueDateObj.toISOString().split("T")[0];
      }
    }

    if (daysLeft <= 7 && daysLeft >= -30) {
      const record: DueRecord = {
        party_name: String(partyName).trim(),
        bill_no: String(billNo).trim(),
        bill_date: normalizeDate(billDate),
        due_date: normalizedDueDate,
        bill_amount: String(billAmount || "").trim(),
        days_left: daysLeft,
      };

      if (partyGstin) {
        record.party_gstin = String(partyGstin).trim();
      }

      dueRecords.push(record);
    }
  }

  return dueRecords;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      const errorResponse: ErrorResponse = {
        status: "error",
        message: "Server configuration error: Missing environment variables",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      const errorResponse: ErrorResponse = {
        status: "error",
        message: "No file provided in request",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      const errorResponse: ErrorResponse = {
        status: "error",
        message: "Invalid file type. Only CSV and Excel files are allowed",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = fileName;

    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBlob, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      const errorResponse: ErrorResponse = {
        status: "error",
        message: `Failed to upload file to storage: ${uploadError.message}`,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedData = parseFile(fileBuffer, file.type);

    if (!parsedData || parsedData.length === 0) {
      const errorResponse: ErrorResponse = {
        status: "error",
        message: "File is empty or could not be parsed",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dueRecords = processRecords(parsedData);

    await supabase.from("file_uploads").insert({
      file_name: file.name,
      file_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      status: "completed",
      due_records_count: dueRecords.length,
      processed_at: new Date().toISOString(),
    });

    const response: ProcessResponse = {
      status: "success",
      file_stored: true,
      storage_path: storagePath,
      due_records: dueRecords,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Process file error:", errorMessage, error);
    const errorResponse: ErrorResponse = {
      status: "error",
      message: errorMessage || "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
