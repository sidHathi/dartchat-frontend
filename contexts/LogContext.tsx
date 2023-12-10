import React, { useState, useCallback, createContext } from 'react';
import Log from '../tests/log';

interface LogContextType {
    log: (newLog: Log) => void;
    logText: (text: string) => void;
    logError: (err: unknown) => void;
    logEncryptionFailure: (err: unknown) => void;
};

const LogContext = createContext<LogContextType>({
    log: () => {},
    logText: () => {},
    logError: () => {},
    logEncryptionFailure: () => {},
});

export default LogContext;
