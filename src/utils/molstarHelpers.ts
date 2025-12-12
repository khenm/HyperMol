import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Asset } from 'molstar/lib/mol-util/assets';
import type { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';
import { StructureRepresentationRegistry } from 'molstar/lib/mol-repr/structure/registry';
import { AnimateModelIndex } from 'molstar/lib/mol-plugin-state/animation/built-in/model-index';
import type { StructureComponentRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';
import { StructureElement } from 'molstar/lib/mol-model/structure';
import { StateSelection } from 'molstar/lib/mol-state';
import { OrderedSet } from 'molstar/lib/mol-data/int';
import { MeasurementGroupTag } from 'molstar/lib/mol-plugin-state/manager/structure/measurement';
import { ColorTheme } from 'molstar/lib/mol-theme/color';

export type RepresentationType = 'cartoon' | 'ball-stick' | 'molecular-surface' | 'gaussian-surface';
export type ColorStyle = 'chain-id' | 'element-symbol' | 'rainbow' | 'hydrophobicity';

/**
 * Loads a PDB/CIF structure from RCSB PDB
 */
export const loadPdbId = async (plugin: PluginContext, pdbId: string) => {
    const url = `https://models.rcsb.org/${pdbId.toLowerCase()}.bcif`;
    
    // Clear previous models to prevent memory leaks (Aggressive M1 Cleanup)
    await plugin.managers.structure.hierarchy.remove(
        plugin.managers.structure.hierarchy.current.structures
    );

    const data = await plugin.builders.data.download({
        url: Asset.Url(url),
        isBinary: true
    });

    const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
    await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
};

/**
 * Loads a local file (PDB/CIF/BCIF)
 */
export const loadLocalFile = async (plugin: PluginContext, file: File) => {
    // Clear previous
    await plugin.managers.structure.hierarchy.remove(
        plugin.managers.structure.hierarchy.current.structures
    );

    const isBinary = file.name.endsWith('.bcif');
    
    const data = await plugin.builders.data.readFile({
        file: Asset.File(file),
        isBinary,
        label: file.name
    });

    // Detect format based on extension
    const format: BuiltInTrajectoryFormat = file.name.endsWith('.pdb') ? 'pdb' : 'mmcif';
    
    const trajectory = await plugin.builders.structure.parseTrajectory(data.data, format);
    await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
};

/**
 * Updates the visual style of the current structure
 */
export const updateRepresentation = async (plugin: PluginContext, type: RepresentationType) => {
    console.log('[HyperMol] updateRepresentation called with type:', type);
    const structures = plugin.managers.structure.hierarchy.current.structures;
    if (structures.length === 0) {
        console.warn('[HyperMol] No structures found');
        return;
    }

    // We select the first structure loaded
    const structure = structures[0];
    
    // 'cartoon' & 'surfaces' usually apply to the Polymer.
    // 'ball-stick' usually applies to everything (All).
    let selectionType: 'polymer' | 'all' = 'polymer';
    if (type === 'ball-stick') {
        selectionType = 'all';
    }
    console.log('[HyperMol] Creating/Selecting component with selection:', selectionType);

    // 1. Try to get or create the component first (Reuse strategy)
    // This looks for an existing component with same params, or creates one.
    let component = await plugin.builders.structure.tryCreateComponentStatic(
        structure.cell, 
        selectionType
    );

    // Fallback if polymer creation failed
    if (!component && selectionType === 'polymer') {
        console.warn('[HyperMol] Polymer component creation failed, falling back to "all"');
        component = await plugin.builders.structure.tryCreateComponentStatic(
            structure.cell, 
            'all'
        );
    }

    // 2. Cleanup: Remove unused components & clear representations on the reused one
    if (component) {
        // We use the snapshot of components from BEFORE the creation to identify what to remove.
        const existingComponents = structure.components;
        const componentsToRemove: StructureComponentRef[] = [];
        const componentCell = component.cell; // Identify by Cell reference
        
        for (const c of existingComponents) {
            // Check if this is the component we are using
            if (c.cell === componentCell) {
                // Same component: Keep it, but clear its existing representations
                console.log('[HyperMol] Reusing component, clearing existing representations');
                await plugin.managers.structure.hierarchy.remove(c.representations);
            } else {
                // Different component: Remove it (view switch)
                console.log('[HyperMol] Removing unused component');
                componentsToRemove.push(c);
            }
        }
        
        if (componentsToRemove.length > 0) {
             await plugin.managers.structure.hierarchy.remove(componentsToRemove);
        }

        // 3. Add new Representation
        console.log('[HyperMol] Adding new representation...');
        const molstarType: StructureRepresentationRegistry.BuiltIn = type === 'ball-stick' ? 'ball-and-stick' : type;

        // Capture camera to prevent auto-zoom
        const cameraSnapshot = plugin.canvas3d?.camera.getSnapshot();

        await plugin.builders.structure.representation.addRepresentation(component, { 
            type: molstarType, 
            color: 'chain-id' 
        });

        // Restore camera
        if (cameraSnapshot) plugin.canvas3d?.camera.setState(cameraSnapshot);
        
        console.log('[HyperMol] Representation added successfully');

    } else {
        console.error('[HyperMol] Failed to create component');
    }
};

/**
 * Applies a color theme to the current representation
 */
export const applyColor = async (plugin: PluginContext, style: ColorStyle) => {
    const structures = plugin.managers.structure.hierarchy.current.structures;
    if (structures.length === 0) return;

    // Use specific components if available, otherwise all
    const components = structures[0].components;
    
    await plugin.managers.structure.component.updateRepresentationsTheme(components, { color: style as ColorTheme.BuiltIn });
};

/**
 * Takes a high-resolution snapshot of the current view
 */
export const takeSnapshot = async (plugin: PluginContext) => {
    // Cast to HTMLCanvasElement to ensure TS knows it has toDataURL
    const canvas = plugin.canvas3d?.webgl.gl.canvas as HTMLCanvasElement;
    if (canvas && typeof canvas.toDataURL === 'function') {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `hypermol-snapshot-${Date.now()}.png`;
        link.click();
    }
};

/**
 * Trajectory Controls
 */
export const playTrajectory = async (plugin: PluginContext) => {
    // Stop any existing animation first to avoid conflicts
    await plugin.managers.animation.stop();
    
    await plugin.managers.animation.play(AnimateModelIndex, {
        duration: { name: 'computed', params: { targetFps: 30 } },
        mode: { name: 'loop', params: { direction: 'forward' } }
    });
};

export const pauseTrajectory = async (plugin: PluginContext) => {
    await plugin.managers.animation.stop();
};

export const getTrajectoryInfo = (plugin: PluginContext) => {
    const structures = plugin.managers.structure.hierarchy.current.structures;
    if (structures.length === 0) return null;

    // Inspect the first structure's first model to see if it has trajectory info
    const str = structures[0].cell.obj?.data;
    if (!str || str.models.length === 0) return null;

    const model = str.models[0];
    // Check if trajectoryInfo exists (it's present on models loaded from trajectories)
    if ('trajectoryInfo' in model) {
         return (model as TypeUnknown).trajectoryInfo as { index: number, size: number };
    }
    return null;
};

// Helper type to avoid 'any'
interface TypeUnknown { [key: string]: unknown }

/**
 * Torsional / Measurement Playground Helpers
 */

export const setSelectionGranularity = (plugin: PluginContext, granularity: 'element' | 'residue') => {
    plugin.managers.interactivity.setProps({ granularity });
};


export const clearMeasurements = async (plugin: PluginContext) => {
    // Remove all objects with the Measurement tag
    const state = plugin.state.data;
    // Use a builder selection to find by tag
    const measures = state.select(StateSelection.Generators.root.subtree().withTag(MeasurementGroupTag));
    for (const m of measures) {
        await state.updateTree(state.build().delete(m.transform.ref)).run();
    }
};

export const measureAtoms = async (plugin: PluginContext, atoms: StructureElement.Loci[], type: 'distance' | 'angle' | 'dihedral') => {

    let required = 2;
    if (type === 'angle') required = 3;
    else if (type === 'dihedral') required = 4;
    
    if (atoms.length !== required) {
        return `Please select exactly ${required} atoms (currently ${atoms.length})`;
    }

    if (type === 'distance') {
        await plugin.managers.structure.measurement.addDistance(atoms[0], atoms[1]);
    } else if (type === 'angle') {
        await plugin.managers.structure.measurement.addAngle(atoms[0], atoms[1], atoms[2]);
    } else if (type === 'dihedral') {
        await plugin.managers.structure.measurement.addDihedral(atoms[0], atoms[1], atoms[2], atoms[3]);
    } 
    
    return `Measured ${type}`;
};

export const measureSelection = async (plugin: PluginContext, type: 'distance' | 'angle' | 'dihedral') => {
    // Legacy method relying on Mol* internal selection
    const structures = plugin.managers.structure.hierarchy.current.structures;
    if (structures.length === 0) return 'No structures loaded';

    // Collect all selected atoms from all structures
    const atoms: StructureElement.Loci[] = [];
    
    for (const s of structures) {
        const data = s.cell.obj?.data;
        if (!data) continue;

        const sel = plugin.managers.structure.selection.getLoci(data);
        if (!sel || sel.kind !== 'element-loci' || StructureElement.Loci.isEmpty(sel)) continue;
        
        const l = StructureElement.Loci.remap(sel, data);
        
        for (const e of l.elements) {
            const indices = e.indices;
            for (let i = 0, il = OrderedSet.size(indices); i < il; i++) {
                const element = OrderedSet.getAt(indices, i);
                atoms.push(
                    StructureElement.Loci(l.structure, [{ 
                        unit: e.unit, 
                        // Cast to any to avoid strict UnitIndex vs ElementIndex nominal typing issues
                        indices: OrderedSet.ofSingleton(element) as OrderedSet<StructureElement.UnitIndex>
                    }])
                );
            }
        }
    }

    return measureAtoms(plugin, atoms, type);
};

/**
 * Helper to deep-clone a generic Loci to prevent object pooling issues (mutability)
 */
export const cloneLoci = (loci: StructureElement.Loci) => {
    return StructureElement.Loci(
        loci.structure,
        loci.elements.map(e => ({
            unit: e.unit,
            indices: OrderedSet.ofSortedArray(OrderedSet.toArray(e.indices)) // Ensure fresh indices copy
        }))
    );
};