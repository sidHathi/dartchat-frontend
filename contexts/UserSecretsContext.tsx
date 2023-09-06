import React, { createContext } from 'react';

type UserSecretsContextType = {
    secrets: {
        [key: string]: Uint8Array;
    } | undefined;
    secretsLoading: boolean;
    initPinKey: (userPinKey: string) => void;
    initUserSecret: (userSecretKey: Uint8Array) => Promise<void>;
    handleNewDBSecrets: (decodedSecrets: {[key: string]: string}) => void;
    handleNewEncryptedConversation: (cid: string, encryptedPrivateKey: string, publicKey: string) => Promise<Uint8Array | undefined>;
    handleNewConversationKey: (cid: string, key: Uint8Array) => Promise<boolean>;
    forgetConversationKeys: (cid: string) => Promise<boolean>;
    pullUserSecrets: () => Promise<void>;
};

const UserSecretsContext = createContext<UserSecretsContextType>({
    secrets: undefined,
    secretsLoading: true,
    initPinKey: () => {},
    initUserSecret: async () => {},
    handleNewDBSecrets: () => {},
    handleNewEncryptedConversation: async () => undefined,
    handleNewConversationKey: async () => false,
    forgetConversationKeys: async () => false,
    pullUserSecrets: async () => {}
});

export default UserSecretsContext;
