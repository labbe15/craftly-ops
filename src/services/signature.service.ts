import { supabase } from "@/integrations/supabase/client";

export interface SignatureUploadResult {
  url: string;
  path: string;
}

/**
 * Uploads a signature blob to Supabase Storage
 * @param quoteId - The ID of the quote being signed
 * @param signatureBlob - The signature image blob
 * @returns The public URL of the uploaded signature
 */
export async function uploadSignature(
  quoteId: string,
  signatureBlob: Blob
): Promise<SignatureUploadResult> {
  const fileName = `quote-${quoteId}-${Date.now()}.png`;
  const filePath = `${quoteId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("signatures")
    .upload(filePath, signatureBlob, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("Error uploading signature:", error);
    throw new Error("Erreur lors du téléchargement de la signature");
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("signatures").getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Updates a quote with signature information
 * @param quoteId - The ID of the quote to update
 * @param signatureUrl - The URL of the uploaded signature
 * @param signerName - The name of the person signing
 * @param signerEmail - The email of the person signing
 */
export async function updateQuoteWithSignature(
  quoteId: string,
  signatureUrl: string,
  signerName: string,
  signerEmail: string
): Promise<void> {
  const { error } = await supabase
    .from("quotes")
    .update({
      signature_url: signatureUrl,
      signed_at: new Date().toISOString(),
      signed_by_name: signerName,
      signed_by_email: signerEmail,
      status: "signed",
    })
    .eq("id", quoteId);

  if (error) {
    console.error("Error updating quote with signature:", error);
    throw new Error("Erreur lors de la mise à jour du devis");
  }
}

/**
 * Deletes a signature from Supabase Storage
 * @param signaturePath - The path of the signature file to delete
 */
export async function deleteSignature(signaturePath: string): Promise<void> {
  const { error } = await supabase.storage.from("signatures").remove([signaturePath]);

  if (error) {
    console.error("Error deleting signature:", error);
    throw new Error("Erreur lors de la suppression de la signature");
  }
}
