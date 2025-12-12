import type { PdbMetadata } from '../types/pdb';

export const fetchPdbMetadata = async (pdbId: string): Promise<PdbMetadata> => {
    // Basic mock implementation for now until real API integration is needed or validated
    // Or try a simple fetch from RCSB REST API if possible
    try {
        const response = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
        if (!response.ok) {
             throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        return {
            id: data.rcsb_id,
            title: data.struct.title,
            description: data.struct.pdbx_descriptor,
            resolution: data.rcsb_entry_info.resolution_combined?.[0]?.toFixed(2) + ' Å',
            organism: data.rcsb_entity_source_organism?.[0]?.scientific_name
        };
    } catch (error) {
        console.warn(`Failed to fetch metadata for ${pdbId}, using fallback.`, error);
        return {
            id: pdbId,
            title: `Structure ${pdbId}`,
            description: 'Metadata not available',
        };
    }
};
