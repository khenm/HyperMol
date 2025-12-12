import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';

interface MolContextType {
    plugin: PluginContext | null;
    setPlugin: (p: PluginContext) => void;
}

const MolContext = createContext<MolContextType | undefined>(undefined);

export const MolContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // We use a ref for the plugin because it's a heavy non-serializable object
    // But we need a state wrapper to trigger re-renders when it initializes
    const pluginRef = useRef<PluginContext | null>(null);
    const [isReady, setIsReady] = useState(false);

    const setPlugin = useCallback((p: PluginContext) => {
        pluginRef.current = p;
        setIsReady(true);
    }, []);

    const value = useMemo(() => ({ 
        plugin: pluginRef.current, 
        setPlugin 
    }), [isReady, setPlugin]);

    return (
        <MolContext.Provider value={value}>
            {children}
        </MolContext.Provider>
    );
};

export const useMolstar = () => {
    const context = useContext(MolContext);
    if (!context) throw new Error('useMolstar must be used within MolContextProvider');
    return context;
};