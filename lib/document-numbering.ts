'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Generates a sequential document number for Work Orders or Quotes
 * Format: OSmmaa-9999 or COTmmaa-9999
 * - OS/COT: Document type prefix
 * - mmaa: Month and year of creation (e.g., 0226 for Feb 2026)
 * - 9999: Sequential counter (continuous, no monthly reset)
 */
export async function generateDocumentNumber(
    tenantId: string,
    docType: 'OS' | 'COT'
): Promise<string> {
    const supabase = await createClient();

    // Get current month/year in mmaa format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const period = `${month}${year}`;

    // Atomically increment the sequence counter
    // Using a transaction-like approach with upsert
    const { data: sequence, error } = await supabase
        .from('tenant_document_sequences')
        .select('last_number')
        .eq('tenant_id', tenantId)
        .eq('doc_type', docType)
        .single();

    let nextNumber: number;

    if (error || !sequence) {
        // First document of this type for this tenant
        nextNumber = 1;
        await supabase
            .from('tenant_document_sequences')
            .insert({
                tenant_id: tenantId,
                doc_type: docType,
                last_number: 1
            });
    } else {
        // Increment existing counter
        nextNumber = sequence.last_number + 1;
        await supabase
            .from('tenant_document_sequences')
            .update({
                last_number: nextNumber,
                updated_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId)
            .eq('doc_type', docType);
    }

    // Format: OSmmaa-9999
    const formattedNumber = String(nextNumber).padStart(4, '0');
    return `${docType}${period}-${formattedNumber}`;
}
