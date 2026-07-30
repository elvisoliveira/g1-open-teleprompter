import React, { createContext, useContext, useState } from 'react';
import { OutputMode } from '../services/DeviceTypes';

const OutputModeContext = createContext<{
    outputMode: OutputMode;
    setOutputMode: (mode: OutputMode) => void;
}>({ outputMode: 'text', setOutputMode: () => { } });

export function OutputModeProvider({ children }: { children: React.ReactNode }) {
    const [outputMode, setOutputMode] = useState<OutputMode>('text');
    return (
        <OutputModeContext.Provider value={{ outputMode, setOutputMode }}>
            {children}
        </OutputModeContext.Provider>
    );
}

export const useOutputMode = () => useContext(OutputModeContext);
