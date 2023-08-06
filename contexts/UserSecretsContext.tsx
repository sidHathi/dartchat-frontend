import React, { createContext } from 'react';

type UserSecretsContextType = {
    secrets: {
        [key: string]: Uint8Array;
    } | undefined;
    secretsLoading: boolean;
    initPinKey: (userPinKey: string) => void;
    initUserSecret: (userSecretKey: Uint8Array) => void;
    handleNewDBSecrets: (decodedSecrets: {[key: string]: string}) => void;
    handleNewEncryptedConversation: (cid: string, encryptedPrivateKey: string, publicKey: string) => Promise<Uint8Array | undefined>;
    handleNewConversationCreated: (cid: string, key: Uint8Array, encodedKey: string) => Promise<boolean>;
    forgetConversationKeys: (cid: string) => Promise<boolean>;
};

const UserSecretsContext = createContext<UserSecretsContextType>({
    secrets: undefined,
    secretsLoading: true,
    initPinKey: () => {},
    initUserSecret: () => {},
    handleNewDBSecrets: () => {},
    handleNewEncryptedConversation: async () => undefined,
    handleNewConversationCreated: async () => false,
    forgetConversationKeys: async () => false
});

export default UserSecretsContext;
