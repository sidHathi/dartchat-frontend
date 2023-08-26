import React, { useCallback, useContext, useMemo, useState } from "react";
import UserSecretsContext from "../../contexts/UserSecretsContext";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import useRequest from "../../requests/useRequest";
import { buildEncryptionKeyFromPIN, decryptUserKeys, encodeKey, getRandomSalt, initUserSecretKey } from "../../utils/encryptionUtils";
import secureStore from "../../localStore/secureStore";
import { useAppDispatch } from "../../redux/hooks";
import { setPublicKey } from "../../redux/slices/userDataSlice";
import { Center, Text, View } from "native-base";
import Spinner from "react-native-spinkit";
import UserPinEntry from "./UserPinEntry";
import UserPinConfirmation from "./UserPinConfirmation";

export default function UserPinController(): JSX.Element {
    /*
    This controller needs to:
    - display a loading screen when appropriate
    - figure out if the user has set a pin (has a pin key)
    - if they should have a pin, but none exists, make them enter it
    - give them the option to change their pin, dump all their conversations,
    and build new keys
    - figure out if the user has secrets
    - if they don't - is this because they haven't been initialized
    or because the secrets aren't stored locally
    - if the secrets aren't stored locally try to pull them
    - provide initialization UI when appropriate
    */
    const dispatch = useAppDispatch();
    const { user, initUserKeyInfo } = useContext(AuthIdentityContext);
    const { secrets, secretsLoading, initUserSecret, handleNewDBSecrets, initPinKey } = useContext(UserSecretsContext);
    const { usersApi } = useRequest();

    // const [newKeySalt, setNewKeySalt] = useState<string | undefined>();
    const [validationLoading, setValidationLoading] = useState(false);
    const [showPinConfirm, setShowPinConfirm] = useState(false);
    const [selectedPin, setSelectedPin] = useState<string | undefined>();

    const userSecretsInitialized = useMemo(() => {
        if (secretsLoading) return undefined;
        if (secrets && secrets.userSecretKey) return true;
        // if we're here then the secrets controller has already tried to pull keys from db or decrypt local keys and failed - pin must be invalid or keys must not be set
        return false;
    }, [secrets, secretsLoading]);

    const initializeSecrets = useCallback(async (userPin: string) => {
        // need backend function to set user encryption keysalt
        if (secretsLoading || secrets || !user) return;
        try {
            const salt = getRandomSalt();
            await usersApi.setKeySalt(salt);
            const userKey = await buildEncryptionKeyFromPIN(userPin, salt);
            if (!userKey) return;
            const keys = initUserSecretKey(userKey, salt);
            const encodedPrivateKey = encodeKey(keys.userKeyPair.secretKey);
            const encodedPublicKey = encodeKey(keys.userKeyPair.publicKey);
            await secureStore.setUserPINEncryptionKey(user.id, userKey);
            await secureStore.addSecureKey(user.id, 'userSecretKey', encodedPrivateKey);
            initPinKey(userKey);
            await usersApi.setUserSecrets(keys.encryptedKeySet);
            await usersApi.updatePublicKey(encodedPublicKey);
            await initUserSecret(keys.userKeyPair.secretKey);
            dispatch(setPublicKey(encodedPublicKey));
            initUserKeyInfo(keys.userKeyPair.publicKey, salt);
        } catch (err) {
            console.log(err);
            return;
        }
    }, [user, secretsLoading, secrets]);

    const validatePin = useCallback(async (pin: string) => {
        // this function needs to attempt to decrypt the user's secretKeys from their userData info based on the generated pin
        if (!user) return false;
        if (secrets && 'userSecretKey' in secrets) return true;
        try {
            let encryptedSecrets = user.secrets;
            let keySalt = user.keySalt;
            console.log(encryptedSecrets);
            if (!encryptedSecrets || !keySalt) {
                const upToDateUser = await usersApi.getCurrentUser();
                if (!upToDateUser || !upToDateUser.secrets) return false;
                encryptedSecrets = upToDateUser.secrets;
                keySalt = upToDateUser.keySalt;
            }
            const constructedPinKey = await buildEncryptionKeyFromPIN(pin, keySalt as string);
            console.log(constructedPinKey);
            if (!constructedPinKey) return false;
            const decodedSecrets = decryptUserKeys(constructedPinKey, keySalt as string, encryptedSecrets as string);
            if ('userSecretKey' in decodedSecrets) {
                await secureStore.setUserPINEncryptionKey(user.id, constructedPinKey);
                initPinKey(constructedPinKey);
                handleNewDBSecrets(decodedSecrets);
                return true;
            }
            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    }, [user, secrets]);

    const userEncryptionStatus = useMemo(() => {
        console.log(user);
        if (secretsLoading) {
            return 'loading';
        } else if (userSecretsInitialized) {
            return 'complete';
        } else if (user && user.secrets && user.keySalt) {
            return 'initializedOnDB';
        } else {
            return 'uninitialized';
        }
    }, [secrets, secretsLoading, user, userSecretsInitialized]);

    const LoadingScreen = () => <View flex='1' bgColor='#fefefe'>
        <Center flex='1'>
            <Spinner type='ThreeBounce' />
            <Text>
                Verifying encryption status
            </Text>
        </Center>
    </View>

    const pinEntryVariant = useMemo(() => {
        console.log(userEncryptionStatus);
        if (userEncryptionStatus === 'uninitialized') {
            return 'initialization';
        }
        return 'confirmation';
    }, [userEncryptionStatus]);

    const onPinConfirm = useCallback(async (pin: string) => {
        console.log('validating pin');
        if (userEncryptionStatus === 'uninitialized') {
            setValidationLoading(true);
            await initializeSecrets(pin);
            setValidationLoading(false);
            return;
        }
        setValidationLoading(true);
        await validatePin(pin);
        setValidationLoading(false);
    }, [selectedPin, userEncryptionStatus]);

    const onPinSubmit = useCallback((pin: string) => {
        if (userEncryptionStatus === 'uninitialized') {
            if (showPinConfirm) {
                onPinConfirm(pin);
                return;
            }
            setSelectedPin(pin);
            setShowPinConfirm(true);
        } else {
            setSelectedPin(pin);
            onPinConfirm(pin);
        }
    }, [userEncryptionStatus, onPinConfirm]);

    return (
        userEncryptionStatus === 'loading' ?
            <LoadingScreen /> :
            (
                showPinConfirm && selectedPin ?
                <UserPinConfirmation 
                    selectedPin={selectedPin}
                    onConfirm={() => onPinConfirm(selectedPin)} 
                    onReject={() => setShowPinConfirm(false)}
                    validationLoading={validationLoading}
                    /> :
                <UserPinEntry 
                    variant={pinEntryVariant} 
                    onSubmit={onPinSubmit}
                    validationLoading={validationLoading} />
            )
            
    );
}
