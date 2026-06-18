import { useCallback, useState } from "react";
import { getUploadUrl, uploadPdf } from "../utils/api";

interface UseSaveAndFaxResult {
  run: (exportBlob: () => Promise<Blob>, filename: string) => Promise<string>;
  saving: boolean;
  error: string | null;
}

export function useSaveAndFax(): UseSaveAndFaxResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (exportBlob: () => Promise<Blob>, filename: string): Promise<string> => {
      setSaving(true);
      setError(null);

      try {
        const blob = await exportBlob();
        const { uploadUrl, s3Key } = await getUploadUrl(filename);
        await uploadPdf(uploadUrl, blob);
        return s3Key;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return { run, saving, error };
}
