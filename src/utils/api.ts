const UPLOAD_URL_API = import.meta.env.VITE_UPLOAD_URL_API as string;
const SEND_FAX_API = import.meta.env.VITE_SEND_FAX_API as string;
const GET_FAX_STATUS_API = import.meta.env.VITE_GET_FAX_STATUS_API as string;

export async function getUploadUrl(filename: string): Promise<{ uploadUrl: string; s3Key: string }> {
  const url = `${UPLOAD_URL_API}?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get upload URL: ${res.status}`);
  return res.json();
}

export async function uploadPdf(uploadUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: blob,
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}

export interface FaxData {
  s3Key: string;
  faxNumber: string;
  coverPage: string;
  subject: string;
  comments: string;
}

export async function sendFax(faxData: FaxData): Promise<{ faxId: string }> {
  const res = await fetch(SEND_FAX_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(faxData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Send fax failed: ${res.status}`);
  }
  return res.json();
}

export async function getFaxStatus(faxDetailsId: string): Promise<{ status: string; details?: unknown }> {
  const res = await fetch(`${GET_FAX_STATUS_API}?faxDetailsId=${encodeURIComponent(faxDetailsId)}`);
  if (!res.ok) throw new Error(`Get fax status failed: ${res.status}`);
  return res.json();
}
