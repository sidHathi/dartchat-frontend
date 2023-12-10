import React, { PropsWithChildren, useCallback, useContext } from "react";
import LogContext from "../../contexts/LogContext";
import Log from "../../tests/log";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { recordLog, testSelector } from "../../redux/slices/testSlice";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { getTextLog } from "../../utils/testUtils";

export default function LogController({
    children
}: PropsWithChildren<{
    children: JSX.Element
}>): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);

    const log = useCallback((log: Log) => {
        if (!user?.devMode) return;
        dispatch(recordLog(log));
    }, [user]);

    const logText = useCallback((text: string) => {
        if (!user?.devMode) return;
        dispatch(recordLog(getTextLog(text)));
    }, [user]);

    const logError = useCallback((err: unknown) => {
        if (!user?.devMode) return;
        const log: Log = {
            timestamp: new Date(),
            type: 'Error',
            encrypted: false,
            encryptionFailure: false,
            error: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        }
        dispatch(recordLog(log));
    }, [user]);

    const logEncryptionFailure = useCallback((err: unknown) => {
        if (!user?.devMode) return;
        const log: Log = {
            timestamp: new Date(),
            type: 'Error',
            encrypted: true,
            encryptionFailure: true,
            error: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        }
        dispatch(recordLog(log));
    }, [user]);

    return <LogContext.Provider value={{
        log,
        logText,
        logError,
        logEncryptionFailure
    }}>
        {children}
    </LogContext.Provider>
}