import React, { PropsWithChildren, ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import secureStore from '../localStore/secureStore';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { decodeKey, decryptJSON, decryptString, decryptUserKeys, encodeKey, encryptJSON, encryptUserSecrets } from '../utils/encryptionUtils';
import useRequest from '../requests/useRequest';
import { ConversationPreview, UserData } from '../types/types';
import UserPinController from './EncryptionUI/UserPinController';
import auth from '@react-native-firebase/auth';
import UserSecretsContext from '../contexts/UserSecretsContext';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, setSecretKey } from '../redux/slices/chatSlice';
import NetworkContext from '../contexts/NetworkContext';
import { storeUserData } from '../localStore/store';

export default function UserSecretsController({
    children
}: PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const { networkConnected } = useContext(NetworkContext);
    const { user, logOut } = useContext(AuthIdentityContext);
    const { usersApi } = useRequest();
    const dispatch = useAppDispatch();
    const { currentConvo } = useAppSelector(chatSelector); 

    const [userPinKey, setUserPinKey] = useState<string | undefined>();
    const [secrets, setSecrets] = useState<{
        [key: string]: Uint8Array;
    } | undefined>(undefined);
    const [secretsLoading, setSecretsLoading] = useState(true);

    const validateUserKeys = useCallback(async (dbUser: UserData, currSecrets?: { [key: string]: Uint8Array }) => {
        if (!networkConnected || !userPinKey || !dbUser.keySalt || !dbUser.secrets) {
            console.log('unable to validate')
            return true;
        }

        try {
            const decryptedSecrets = await decryptUserKeys(userPinKey, dbUser.keySalt, dbUser.secrets);
            const decodedSecrets = Object.fromEntries(
                Object.entries(decryptedSecrets).map(([key, val]) => {
                    return [key, decodeKey(val as string)]
                })
            );
            const workingSecrets = currSecrets || secrets || undefined;
            console.log(workingSecrets);
            if (!('userSecretKey' in decodedSecrets)) {
                console.log('invalid db secrets');
                return false;
            }
            // console.log(encodeKey(decodedSecrets.userSecretKey));
            // console.log(encodeKey(workingSecrets?.userSecretKey || new Uint8Array()));
            if ((decryptedSecrets === undefined) || ((workingSecrets?.userSecretKey !== undefined && (encodeKey(decodedSecrets.userSecretKey) !== encodeKey(workingSecrets.userSecretKey))))) {
                // this happens during environment switches when local and db keys are out of sync
                console.log('logging out user')
                logOut();
                return false;
            } else {
                if (dbUser) {
                    await storeUserData(dbUser);
                }
            }
            return true;
        } catch (err) {
            console.log('unable to decrypt db secrets');
            // logOut();
            return false;
        }
    }, [userPinKey, secrets, networkConnected])

    const updateDBSecrets = useCallback(async (newSecrets: {
        [key: string]: Uint8Array
    }, dbUser?: UserData) => {
        if (!userPinKey || !user || !user.keySalt || !newSecrets.userSecretKey) return false;
        try {
            // console.log('attempting db update');
            const latestUser = dbUser || await usersApi.getCurrentUser();
            if (!await validateUserKeys(latestUser)) return false;
            const encodedSecrets = Object.fromEntries(
                Object.entries(newSecrets).map(([key, val]) => [key, val ? encodeKey(val): ''])
            );
            const encryptedSecrets = encryptUserSecrets(userPinKey, user.keySalt, encodedSecrets);
            await usersApi.setUserSecrets(encryptedSecrets);
            return true;
        } catch (err) {
            console.log('db update error');
            console.log(err);
            return false;
        }
    }, [secrets, usersApi, user, userPinKey, validateUserKeys]);

    const pullUserSecrets = useCallback(async () => {
        if (!user) return;
        setSecretsLoading(true);
        try {
            const latestUser = await usersApi.getCurrentUser();
            if (!await validateUserKeys(latestUser)) return;
            const updates: {[key: string]: Uint8Array} = {};
            if (!latestUser.conversations || !secrets || !secrets.userSecretKey) return;
            await Promise.all(
                latestUser.conversations.map(async (c: ConversationPreview) => {
                    if (c.keyUpdate && c.publicKey) {
                        const decodedPublicKey = decodeKey(c.publicKey);
                        const newKeyObj = decryptJSON(secrets.userSecretKey, c.keyUpdate, decodedPublicKey);
                        if (newKeyObj && newKeyObj.secretKey) {
                            updates[c.cid] = decodeKey(newKeyObj.secretKey);
                        }
                    }
                })
            );
            const newSecrets = {
                ...secrets,
                ...updates
            }
            setSecrets(newSecrets);
            try {
                // console.log('attempting to pull user secrets');
                const encodedSecrets = Object.fromEntries(
                    Object.entries(newSecrets).map(([key, val]) => [key, val ? encodeKey(val): ''])
                );
                if (encodedSecrets.userSecretKey) {
                    // console.log('STORING SECRETS:')
                    // console.log(encodedSecrets);
                    await secureStore.initUserSecretKeyStore(user.id, encodedSecrets);
                }
            } catch (err) {
                console.log(err);
            }
            setSecretsLoading(false);
        } catch (err) {
            console.log(err);
            setSecretsLoading(false);
        }
    }, [usersApi, secrets, user, validateUserKeys]);
    
    const checkForUpdates = useCallback(async (currSecrets: { [key: string]: Uint8Array } | undefined) => {
        if (!user || !currSecrets?.userSecretKey) return;
        setSecretsLoading(true);
        try {
            const latestUser = await usersApi.getCurrentUser();
            if (!await validateUserKeys(latestUser)) return;
            
            const updates: {[key: string]: Uint8Array} = {};
            if (!latestUser.conversations) return
            await Promise.all(
                latestUser.conversations.map(async (c: ConversationPreview) => {
                    if (c.keyUpdate && c.publicKey) {
                        const decodedPublicKey = decodeKey(c.publicKey);
                        const newKeyObj = decryptJSON(currSecrets.userSecretKey, c.keyUpdate, decodedPublicKey);
                        if (newKeyObj && newKeyObj.secretKey) {
                            updates[c.cid] = decodeKey(newKeyObj.secretKey);
                        }
                    }
                })
            );
            const newSecrets = {
                ...secrets,
                ...updates
            }
            const encodedSecrets = Object.fromEntries(
                Object.entries(newSecrets).map(([key, val]) => [key, val ? encodeKey(val): ''])
            );
            setSecrets(newSecrets);
            if (encodedSecrets.userSecretKey) {
                console.log('STORING SECRETS:')
                console.log(encodedSecrets);
                await secureStore.initUserSecretKeyStore(user.id, encodedSecrets);
            }
            if (await updateDBSecrets(newSecrets, latestUser)) {
                await usersApi.readConversationKeyUpdates(Object.keys(updates));
            }
            setSecretsLoading(false);
            return;
        } catch (err) {
            console.log('secrets update failed');
            setSecretsLoading(false);
            console.log(err);
            return;
        }
    }, [user, updateDBSecrets, validateUserKeys]);

    const getSecrets = useCallback(async () => {
        if (!user) return;
        try {
            console.log('setting up user secrets context');
            const storedSecrets = await secureStore.getUserSecretKeyStore(user.id);
            if (storedSecrets && 'userSecretKey' in storedSecrets) {
                const decodedSecrets = (Object.fromEntries(
                    Object.entries(storedSecrets).map(([key, val]) => [key, decodeKey(val as string)])
                ));
                if (secrets) {
                    const newSecrets = {
                        ...secrets,
                        ...decodedSecrets
                    }
                    const encodedSecrets = Object.fromEntries(
                        Object.entries(newSecrets).map(([key, val]) => [key, val ? encodeKey(val): ''])
                    );
                    setSecrets(newSecrets);
                    if (encodedSecrets.userSecretKey) {
                        console.log('STORING SECRETS:')
                        console.log(encodedSecrets);
                         await secureStore.initUserSecretKeyStore(user.id, encodedSecrets);
                    }
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
                    // await secureStore.initUserSecretKeyStore(user.id, decryptedSecrets);
                    if (secrets) {
                        const newSecrets = {
                            ...secrets,
                            ...decodedSecrets
                        }
                        const encodedSecrets = Object.fromEntries(
                            Object.entries(newSecrets).map(([key, val]) => [key, val ? encodeKey(val): ''])
                        );
                        setSecrets(newSecrets);
                        if (encodedSecrets.userSecretKey) {
                            // console.log('STORING SECRETS:')
                            // console.log(encodedSecrets);
                            await secureStore.initUserSecretKeyStore(user.id, encodedSecrets);
                        }
                    } else {
                        // console.log('STORING SECRETS:')
                        // console.log(decryptedSecrets);
                        setSecrets(decodedSecrets);
                        await secureStore.initUserSecretKeyStore(user.id, decryptedSecrets);
                    }
                    return decodedSecrets;
                }
            }
        } catch (err) {
            console.log('getSecrets failed');
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
        await updateDBSecrets(initialSecrets);
        setSecrets(initialSecrets);
    }, [setSecrets, updateDBSecrets]);

    const handleNewDBSecrets = useCallback(async (decryptedSecrets: {[key: string]: string}) => {
        const newSecrets = Object.fromEntries(
            Object.entries(decryptedSecrets)
                .map(([key, val]) => [key, decodeKey(val)])
        );
        if (user && decryptedSecrets.userSecretKey && newSecrets) {
            // console.log('STORING SECRETS:')
            // console.log(decryptedSecrets);
            await secureStore.initUserSecretKeyStore(user.id, decryptedSecrets);
        }
        setSecrets(newSecrets);
    }, [secrets]);

    const handleNewEncryptedConversation = useCallback(async (cid: string, encryptedPrivateKey: string, publicKey: string) => {
        if (!secrets || secretsLoading || !user || !userPinKey || !user.keySalt) {
            return undefined;
        } 
        // this needs to add the secret to locally stored secrets, add the secret to secrets context, and encrypt the new secrets object for addition to the user's database secrets
        const userSecretKey = secrets.userSecretKey;
        const decodedPublicKey = decodeKey(publicKey);
        if (!userSecretKey) return undefined;
        const decryptedKeyMap = decryptJSON(userSecretKey, encryptedPrivateKey, decodedPublicKey) || {}; // base64
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
            return decodeKey(decryptedKey);
        } else {
            await secureStore.addSecureKey(user.id, cid, decryptedKey);
            setSecrets(newSecrets);
        }
        return undefined;
    }, [secrets, secretsLoading, user, userPinKey, updateDBSecrets]);

    const handleNewConversationKey = useCallback(async (cid: string, key: Uint8Array, encodedKey: string) => {
        if (!user) return false;
        try {
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
                return true;
            } else {
                await secureStore.addSecureKey(user.id, cid, encodedKey);
                setSecrets(newSecrets);
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
            try {
                setSecretsLoading(true);
                const key = await secureStore.getUserPINEncryptionKey(user.id);
                if (key) {
                    setUserPinKey(key);
                } else {
                    setSecretsLoading(false);
                }
            } catch (err) {
                setSecretsLoading(false);
            }
        }
        getUserPinKey();
    }, [userPinKey, user])

    useEffect(() => {
        if (secrets || !userPinKey) return;
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
        forgetConversationKeys,
        pullUserSecrets
    }}>
        {
            secrets ?
            ( children ) :
            ( <UserPinController /> )
        }
    </UserSecretsContext.Provider>
}
