import React, { PropsWithChildren, ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import secureStore from '../localStore/secureStore';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { decodeKey, decryptJSON, decryptUserKeys } from '../utils/encryptionUtils';
import useRequest from '../requests/useRequest';
import { ConversationPreview } from '../types/types';
import UserPinController from './EncryptionUI/UserPinController';
import auth from '@react-native-firebase/auth';

type UserSecretsContextType = {
    secrets: {
        [key: string]: Uint8Array;
    } | undefined;
    secretsLoading: boolean;
    initUserSecret: (userSecretKey: Uint8Array) => void;
    handleDBSecrets: (decodedSecrets: {[key: string]: string}) => void;
};

export const UserSecretsContext = createContext<UserSecretsContextType>({
    secrets: undefined,
    secretsLoading: true,
    initUserSecret: () => {},
    handleDBSecrets: () => {}
});

export default function UserSecretsContextProvider({
    children
}: PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { usersApi } = useRequest();

    const [userKey, setUserKey] = useState<string | undefined>();
    const [secrets, setSecrets] = useState<{
        [key: string]: Uint8Array;
    } | undefined>(undefined);
    const [secretsLoading, setSecretsLoading] = useState(true);

    const checkForUpdates = useCallback(async () => {
        if (!user || !secrets?.userSecretKey) return;
        setSecretsLoading(true);
        try {
            const latestUser = await usersApi.getCurrentUser();
            const updates: {[key: string]: Uint8Array} = {};
            if (!latestUser.conversations) return
            await Promise.all(
                    latestUser.conversations.map(async (c: ConversationPreview) => {
                    if (c.keyUpdate && c.publicKey) {
                        const decodedPublicKey = decodeKey(c.publicKey);
                        const decryptedUpdate = decryptJSON(secrets.userSecretKey, c.keyUpdate, decodedPublicKey);
                        if (decryptedUpdate && 'newKey' in decryptedUpdate) {
                            await secureStore.updateUserSecretKeyStore(user.id, c.cid, decryptedUpdate.newKey);
                            updates[c.cid] = decodeKey(decryptedUpdate.newKey);
                        }
                    }
                })
            );
            setSecrets({
                ...secrets,
                ...updates,
            });
            await usersApi.readConversationKeyUpdates(Object.keys(updates));
            setSecretsLoading(false);
            return;
        } catch (err) {
            setSecretsLoading(false);
            console.log(err);
            return;
        }
    }, [user, secrets]);

    const getSecrets = useCallback(async () => {
        if (!user) return;
        try {
            const storedSecrets = await secureStore.getUserSecretKeyStore(user.id);
            if (storedSecrets && 'userSecretKey' in storedSecrets) {
                setSecrets(storedSecrets);
            } else if (user.id && user.secrets && user.keySalt && userKey) {
                // if this is a new device but the user has entered their pin
                const decryptedSecrets = await decryptUserKeys(userKey, user.keySalt, user.secrets);
                const decodedSecrets = Object.fromEntries(
                    Object.entries(decryptedSecrets).map(([key, val]) => {
                        return [key, decodeKey(val as string)]
                    })
                );
                if (decodedSecrets && 'userSecretKey' in decodedSecrets) {
                    setSecrets(decodedSecrets);
                }
            }
        } catch (err) {
            console.log(err);
            return;
        }
    }, [user, userKey]);

    useEffect(() => {
        if (userKey || !user) return;
        const getUserKey = async () => {
            const key = await secureStore.getUserPINEncryptionKey(user.id);
            if (key) {
                setUserKey(key);
            }
        }
        getUserKey();
    }, [userKey])

    useEffect(() => {
        if (secrets || !userKey) return;
        getSecrets()
            .then(async () => {
                await checkForUpdates();
                setSecretsLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setSecretsLoading(false);
            });
    }, [secrets, userKey]);

    const initUserSecret = (userSecretKey: Uint8Array) => {
        setSecrets({
            userSecretKey
        })
    };

    const handleDBSecrets = useCallback((decryptedSecrets: {[key: string]: string}) => {
        const newSecrets = Object.fromEntries(
            Object.entries(decryptedSecrets)
                .map(([key, val]) => [key, decodeKey(val)])
        );
        setSecrets(newSecrets);
    }, [secrets]);

    return <UserSecretsContext.Provider value={{
        secrets,
        secretsLoading,
        initUserSecret,
        handleDBSecrets
    }}>
        {
            secrets ?
            ( children ) :
            ( <UserPinController /> )
        }
    </UserSecretsContext.Provider>
}
