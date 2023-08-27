import React, { PropsWithChildren, ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import secureStore from '../localStore/secureStore';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { decodeKey, decryptJSON, decryptString, decryptUserKeys, encodeKey, encryptJSON, encryptUserSecrets } from '../utils/encryptionUtils';
import useRequest from '../requests/useRequest';
import { ConversationPreview } from '../types/types';
import UserPinController from './EncryptionUI/UserPinController';
import auth from '@react-native-firebase/auth';
import UserSecretsContext from '../contexts/UserSecretsContext';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, setSecretKey } from '../redux/slices/chatSlice';

export default function UserSecretsController({
    children
}: PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { usersApi } = useRequest();
    const dispatch = useAppDispatch();
    const { currentConvo } = useAppSelector(chatSelector); 

    const [userPinKey, setUserPinKey] = useState<string | undefined>();
    const [secrets, setSecrets] = useState<{
        [key: string]: Uint8Array;
    } | undefined>(undefined);
    const [secretsLoading, setSecretsLoading] = useState(true);

    const updateDBSecrets = useCallback(async (newSecrets: {
        [key: string]: Uint8Array
    }) => {
        console.log(userPinKey);
        if (!userPinKey || !user || !user.keySalt) return false;
        console.log('pin variables exist');
        try {
            const encodedSecrets = Object.fromEntries(
                Object.entries(newSecrets).map(([key, val]) => [key, encodeKey(val)])
            );
            console.log(encodedSecrets);
            const encryptedSecrets = encryptUserSecrets(userPinKey, user.keySalt, encodedSecrets);
            console.log('encrypted secrets:')
            console.log(encryptedSecrets);
            await usersApi.setUserSecrets(encryptedSecrets);
            return true;
        } catch (err) {
            console.log('db update error');
            console.log(err);
            return false;
        }
    }, [secrets, usersApi, user, userPinKey]);
    
    const checkForUpdates = useCallback(async (currSecrets: { [key: string]: Uint8Array } | undefined) => {
        if (!user || !currSecrets?.userSecretKey) return;
        setSecretsLoading(true);
        try {
            const latestUser = await usersApi.getCurrentUser();
            const updates: {[key: string]: Uint8Array} = {};
            if (!latestUser.conversations) return
            await Promise.all(
                latestUser.conversations.map(async (c: ConversationPreview) => {
                    if (c.keyUpdate && c.publicKey) {
                        console.log('implementing key update');
                        console.log(c.keyUpdate);
                        console.log(c.publicKey);
                        console.log(currSecrets.userSecretKey);
                        const decodedPublicKey = decodeKey(c.publicKey);
                        const newKeyObj = decryptJSON(currSecrets.userSecretKey, c.keyUpdate, decodedPublicKey);
                        console.log(newKeyObj);
                        if (newKeyObj && newKeyObj.secretKey) {
                            await secureStore.addSecureKey(user.id, c.cid, newKeyObj.secretKey);
                            updates[c.cid] = decodeKey(newKeyObj.secretKey);
                        }
                    }
                })
            );
            const newSecrets = {
                ...currSecrets,
                ...updates,
            };
            if (await updateDBSecrets(newSecrets)) {
                await usersApi.readConversationKeyUpdates(Object.keys(updates));
                setSecrets(newSecrets);
            }
            setSecretsLoading(false);
            return;
        } catch (err) {
            setSecretsLoading(false);
            console.log(err);
            return;
        }
    }, [user, updateDBSecrets]);

    const getSecrets = useCallback(async () => {
        if (!user) return;
        try {
            console.log('getting user secrets')
            const storedSecrets = await secureStore.getUserSecretKeyStore(user.id);
            if (storedSecrets && 'userSecretKey' in storedSecrets) {
                const decodedSecrets = (Object.fromEntries(
                    Object.entries(storedSecrets).map(([key, val]) => [key, decodeKey(val as string)])
                ));
                if (secrets) {
                    setSecrets({
                        ...secrets,
                        ...decodedSecrets
                    });
                } else {
                    setSecrets(decodedSecrets);
                }
                return decodedSecrets;
            } else if (user && user.secrets && user.keySalt && userPinKey) {
                // if this is a new device but the user has entered their pin
                const decryptedSecrets = await decryptUserKeys(userPinKey, user.keySalt, user.secrets);
                const decodedSecrets = Object.fromEntries(
                    Object.entries(decryptedSecrets).map(([key, val]) => {
                        return [key, decodeKey(val as string)]
                    })
                );
                if (decodedSecrets && 'userSecretKey' in decodedSecrets) {
                    console.log('initializing secure store')
                    await secureStore.initUserSecretKeyStore(user.id, decryptedSecrets);
                    if (secrets) {
                        setSecrets({
                            ...secrets,
                            ...decodedSecrets
                        });
                    } else {
                        setSecrets(decodedSecrets);
                    }
                    return decodedSecrets;
                }
            }
        } catch (err) {
            console.log(err);
            return;
        }
    }, [user, userPinKey, secrets]);

    const initPinKey = (newPinKey: string) => {
        setUserPinKey(newPinKey);
    };

    const initUserSecret = useCallback(async (userSecretKey: Uint8Array) => {
        const initialSecrets = {
            userSecretKey
        };
        if (await updateDBSecrets(initialSecrets)) {
            setSecrets(initialSecrets);
        }
    }, [setSecrets, updateDBSecrets]);

    const handleNewDBSecrets = useCallback((decryptedSecrets: {[key: string]: string}) => {
        const newSecrets = Object.fromEntries(
            Object.entries(decryptedSecrets)
                .map(([key, val]) => [key, decodeKey(val)])
        );
        setSecrets(newSecrets);
    }, [secrets]);

    const handleNewEncryptedConversation = useCallback(async (cid: string, encryptedPrivateKey: string, publicKey: string) => {
        if (!secrets || secretsLoading || !user || !userPinKey || !user.keySalt) {
            return undefined;
        } 
        // this needs to add the secret to locally stored secrets, add the secret to secrets context, and encrypt the new secrets object for addition to the user's database secrets
        console.log('handling new encrypted conversation keys');
        const userSecretKey = secrets.userSecretKey;
        const decodedPublicKey = decodeKey(publicKey);
        console.log(`userSecretKey: ${userSecretKey}`);
        if (!userSecretKey) return undefined;
        console.log(publicKey);
        const decryptedKeyMap = decryptJSON(userSecretKey, encryptedPrivateKey, decodedPublicKey) || {}; // base64
        console.log(`decryptedKeyMap: ${decryptedKeyMap}`);
        console.log(decryptedKeyMap);
        if (!decryptedKeyMap.secretKey) return undefined;
        const decryptedKey = decryptedKeyMap.secretKey;
        if (secrets && cid in secrets && secrets[cid] === decryptedKey) {
            return secrets[cid];
        }
        const newSecrets = {
            ...secrets,
            [cid]: decodeKey(decryptedKey)
        }
        if (await updateDBSecrets(newSecrets)) {
            await secureStore.addSecureKey(user.id, cid, decryptedKey);
            setSecrets(newSecrets);
            if (currentConvo?.id === cid) {
                dispatch(setSecretKey(decryptedKey));
            }
            console.log('successfully added new encrypted keys');
            return decodeKey(decryptedKey);
        }
        return undefined;
    }, [secrets, secretsLoading, user, userPinKey, updateDBSecrets]);

    const handleNewConversationKey = useCallback(async (cid: string, key: Uint8Array, encodedKey: string) => {
        if (!user) return false;
        try {
            console.log('handling new conversation keys');
            const newSecrets = {
                ...(secrets || {}),
                [cid]: key
            };
            if (await updateDBSecrets(newSecrets)) {
                await secureStore.addSecureKey(user.id, cid, encodedKey);
                setSecrets(newSecrets);
                if (currentConvo?.id === cid) {
                    dispatch(setSecretKey(key));
                }
                console.log('successfully created new encrypted keys');
                return true;
            }
            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    }, [secrets, user, updateDBSecrets]);

    const forgetConversationKeys = useCallback(async (cid: string) => {
        try {
            if (secrets && cid in secrets) {   
                const newSecrets = Object.fromEntries(
                    Object.entries(secrets).filter(([s, _]) => s !== cid)
                )
                const updateRes = await updateDBSecrets(newSecrets);
                if (!updateRes) return false;
                setSecrets(
                   newSecrets
                )
            }
            user && await secureStore.removeKey(user.id, cid);
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }, [secrets]);

    useEffect(() => {
        if (userPinKey || !user) return;
        const getUserPinKey = async () => {
            console.log('pulling user key');
            try {
                setSecretsLoading(true);
                const key = await secureStore.getUserPINEncryptionKey(user.id);
                console.log(`key: ${key}`);
                if (key) {
                    setUserPinKey(key);
                } else {
                    setSecretsLoading(false);
                }
            } catch (err) {
                console.log('keyfetch failed');
                setSecretsLoading(false);
            }
        }
        getUserPinKey();
    }, [userPinKey, user])

    useEffect(() => {
        console.log('user secrets:')
        console.log(secrets);
        if (secrets || !userPinKey) return;
        console.log('pulling user secrets');
        setSecretsLoading(true);
        getSecrets()
            .then(async (retrievedSecrets) => {
                if (retrievedSecrets) {
                    await checkForUpdates(retrievedSecrets);
                }
                setSecretsLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setSecretsLoading(false);
            });
    }, [secrets, userPinKey, user]);

    return <UserSecretsContext.Provider value={{
        secrets,
        secretsLoading,
        initPinKey,
        initUserSecret,
        handleNewDBSecrets,
        handleNewEncryptedConversation,
        handleNewConversationKey,
        forgetConversationKeys
    }}>
        {
            secrets ?
            ( children ) :
            ( <UserPinController /> )
        }
    </UserSecretsContext.Provider>
}
