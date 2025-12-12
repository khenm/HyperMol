import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import type { PluginLayoutControlsDisplay } from 'molstar/lib/mol-plugin/layout';
import { DefaultPluginUISpec, type PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';

export const MOLS_SPEC: PluginUISpec = {
    ...DefaultPluginUISpec(),
    layout: {
        initial: {
            isExpanded: false,
            showControls: false,
            controlsDisplay: 'reactive' as PluginLayoutControlsDisplay,
        },
    },
    config: [
        [PluginConfig.Viewport.ShowAnimation, false],
        [PluginConfig.Viewport.ShowSelectionMode, false],
        [PluginConfig.General.PixelScale, 2], // High DPI for crisp "paper-like" look
    ],
};