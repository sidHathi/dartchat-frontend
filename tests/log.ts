export default interface Log {
    timestamp: Date;
    type: string;
    encrypted: boolean;
    encryptionFailure: boolean;
    error?: string;
    textPreview?: string;
}

export type StoredLog = Omit<Log, 'timestamp'> & {
    timestamp: string
};
