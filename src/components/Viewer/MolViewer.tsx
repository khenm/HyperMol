import React, { useEffect, useRef } from 'react';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { Color } from 'molstar/lib/mol-util/color';
import 'molstar/lib/mol-plugin-ui/skin/light.scss'; 

import { MOLS_SPEC } from '../../utils/molstarConfig';
import { useMolstar } from '../../context/MolContext';
import { loadPdbId } from '../../utils/molstarHelpers';

export const MolViewer: React.FC = () => {
    const parentRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef<boolean>(false);
    const { setPlugin } = useMolstar();

    useEffect(() => {
        if (!parentRef.current || initializedRef.current) return;
        
        const initViewer = async () => {
            initializedRef.current = true;

            try {
                // Initialize Mol*
                const plugin = await createPluginUI({
                    target: parentRef.current!,
                    spec: { ...MOLS_SPEC },
                    render: renderReact18
                });

                // 1. WEB GPU CHECK / RENDERER SETUP
                const canvas3d = plugin.canvas3d;
                if (canvas3d) {
                    // Check if we are running on WebGL2 (WebGPU is not yet supported in Mol*)
                    const isWebGL2 = canvas3d.webgl.isWebGL2; 
                    
                if (isWebGL2) {
                    console.log("HyperMol: Running on WebGL2 ⚡️");
                } else {
                    console.log("HyperMol: Running on WebGL1");
                }

                // 2. SET "CLAUDE" BACKGROUND (Matches CSS #F2F0E9)
                // 0xF2F0E9 converted to hex integer
                const beigeHex = 0xF2F0E9; 
                const renderer = canvas3d.props.renderer;
                
                canvas3d.setProps({
                    renderer: { 
                        ...renderer, 
                        backgroundColor: Color(beigeHex)
                    },
                    postprocessing: {
                        occlusion: { name: 'on', params: { ...canvas3d.props.postprocessing.occlusion.params, samples: 32, radius: 5 } },
                        outline: { name: 'on', params: { ...canvas3d.props.postprocessing.outline.params, color: Color(0x555555), scale: 1 } }
                    }
                });
            }

                setPlugin(plugin);
                await loadPdbId(plugin, '1BNA'); // Default DNA

            } catch (error) {
                console.error("Failed to initialize Mol*", error);
            }
        };

        initViewer();
    }, [setPlugin]);

    return (
        <div 
            ref={parentRef} 
            style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0,
                // Ensure the container matches the bg to avoid flash of white
                backgroundColor: '#F2F0E9' 
            }} 
        />
    );
};