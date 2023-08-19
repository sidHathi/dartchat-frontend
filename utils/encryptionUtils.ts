import { getRandomBytes } from 'expo-crypto';
import { box, setPRNG } from 'tweetnacl';
import { decode as decodeUTF8, encode as encodeUTF8 } from "@stablelib/utf8";
import {
  decode as decodeBase64,
  encode as encodeBase64,
} from "@stablelib/base64";
import { DecryptedMessage, EncryptedMessage, EncryptionFields, UserConversationProfile, UserProfile } from '../types/types';
import { parseSocketMessage } from './requestUtils';
import scrypt from 'react-native-scrypt';
import aes from 'aes-js';
import { AES, enc } from 'react-native-crypto-js';

// credit to https://github.com/Savinvadim1312/SignalClone/tree/main

setPRNG((x, n) => {
    const randomBytes = getRandomBytes(n);
    for (let i = 0; i < n; i++) {
        x[i] = randomBytes[i];
    }
});

const newNonce = () => getRandomBytes(box.nonceLength);

export const genKeyPair = () => box.keyPair();

export const encryptString = (senderSecretKey: Uint8Array, stringVal: string, recipientPublicKey?: Uint8Array) => {
    const nonce = newNonce();
    const encodedVal = encodeUTF8(stringVal);
    const encryptedVal = recipientPublicKey
        ? box(encodedVal, nonce, recipientPublicKey, senderSecretKey)
        : box.after(encodedVal, nonce, senderSecretKey);

    const fullArr = new Uint8Array(nonce.length + encryptedVal.length);
    fullArr.set(nonce);
    fullArr.set(encryptedVal, nonce.length);

    const base64EncodedRes = encodeBase64(fullArr);
    return base64EncodedRes;
};

export const encryptJSON = (senderSecretKey: Uint8Array, json: any, recipientPublicKey?: Uint8Array) => {
    return encryptString(senderSecretKey, JSON.stringify(json), recipientPublicKey);
};

export const decryptString = (recipientPrivateKey: Uint8Array, messageWithNonce: string, senderPublicKey?: Uint8Array) => {
    try {
        const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
        const message = messageWithNonceAsUint8Array.slice(
            box.nonceLength,
            messageWithNonce.length
        );

        const decrypted = senderPublicKey
            ? box.open(message, nonce, senderPublicKey, recipientPrivateKey)
            : box.open.after(message, nonce, recipientPrivateKey);

        if (!decrypted) {
            throw new Error("Could not decrypt message");
        }

        const base64DecryptedMessage = decodeUTF8(decrypted);
        return base64DecryptedMessage;
    } catch (err) {
        console.log(err);
        return '{}';
    }
};

export const decryptJSON = (recipientPrivateKey: Uint8Array, messageWithNonce: string, senderPublicKey?: Uint8Array): any | undefined => {
    console.log(encodeKey(recipientPrivateKey));
    senderPublicKey && console.log(encodeKey(senderPublicKey));
    console.log(`decrypted string: ${decryptString(recipientPrivateKey, messageWithNonce, senderPublicKey)}`);
    try {
        const decrypted = JSON.parse(decryptString(recipientPrivateKey, messageWithNonce, senderPublicKey));
        console.log(decrypted);
        return decrypted;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const stringToUint8Array = (content: string) =>
  Uint8Array.from(content.split(",").map((str: string) => parseInt(str)));

export const encryptMessage = (message: DecryptedMessage, userSecretKey: Uint8Array, recipientPublicKey: Uint8Array): EncryptedMessage => {
    const encryptedFields = encryptJSON(userSecretKey, {
        content: message.content,
        media: message.media,
        objectRef: message.objectRef,
    }, recipientPublicKey);
    return {
        id: message.id,
        timestamp: message.timestamp,
        messageType: message.messageType,
        encryptionLevel: 'encrypted',
        senderId: message.senderId,
        likes: message.likes,
        senderProfile: message.senderProfile,
        delivered: message.delivered,
        mentions: message.mentions,
        replyRef: message.replyRef,
        encryptedFields
    };
};

export const decryptMessage = (message: EncryptedMessage, userSecretKey: Uint8Array, senderPublicKey: Uint8Array) => {
    const decryptedFields: EncryptionFields | undefined = decryptJSON(userSecretKey, message.encryptedFields, senderPublicKey) || {};
    if (!decryptedFields) return undefined;
    const decryptedMessage = parseSocketMessage({
        ...message,
        encryptionLevel: 'none',
        ...decryptedFields,
    }) as DecryptedMessage;
    return decryptedMessage;
};

export const buildEncryptionKeyFromPIN = async (pin: string, salt: string) => {
    try {
        if (pin.length !== 6) return null;
        const b64EncodedPin = encodeBase64(encodeUTF8(pin));
        const N = 1024;
        const r = 8;
        const p = 1;
        const key = await scrypt(
            b64EncodedPin,
            salt,
            N,
            r,
            p,
            box.secretKeyLength,
            'base64',
        )
        return key;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const initUserSecretKey = (encryptionKey: string, salt: string, existingKeySet?: JSON) => {
    const keyPair = genKeyPair();
    const b64EncodedSecret = {
        ...existingKeySet,
        userSecretKey: encodeBase64(keyPair.secretKey)
    };
    
    console.log(b64EncodedSecret);
    const encryptedKeySet = encryptUserSecrets(encryptionKey, salt, b64EncodedSecret)
    return {
        encryptedKeySet,
        userKeyPair: keyPair
    };
};

export const decryptUserKeys = (encryptionKey: string, salt: string, encryptedKeySet: string): any => {
    console.log(encryptionKey);
    const iv = enc.Base64.parse(salt);
    const key = enc.Base64.parse(encryptionKey);
    const decryptedString = AES.decrypt(encryptedKeySet, key, { iv }).toString(enc.Utf8);
    console.log(decryptedString);
    const decrypted = JSON.parse(decryptedString);
    console.log(decrypted);
    return decrypted;
};

export const encryptUserSecrets = (encryptionKey: string, salt: string, keys: any): string => {
    const iv = enc.Base64.parse(salt);
    const key = enc.Base64.parse(encryptionKey);
    const encrypted = AES.encrypt(JSON.stringify(keys), key, { iv }).toString();
    console.log('encrypted vs decrypted');
    console.log(encrypted);
    console.log(`decrypted: ${decryptUserKeys(encryptionKey, salt, encrypted)}`);
    return encrypted;
}

export const getRandomSalt = (): string => {
    const byteArr = getRandomBytes(16);
    return encodeBase64(byteArr);
};

export const getNewConversationKeys = async (recipientProfiles: UserProfile[] | UserConversationProfile[]) => {
    try {
        const newConvoKeyPair = genKeyPair();
        const encodedKeyPair = Object.fromEntries(
            Object.entries(newConvoKeyPair).map(([key, val]) => [key, encodeBase64(val)])
        );
        const encryptedKeysForUsers = Object.fromEntries(
            recipientProfiles.map((profile) =>{
                if (!profile.publicKey) return [profile.id, undefined];
                const decodedProfilePublicKey = decodeBase64(profile.publicKey);
                return [profile.id, encryptJSON(newConvoKeyPair.secretKey, {
                    secretKey: encodedKeyPair.secretKey
                }, decodedProfilePublicKey)];
            }).filter(([key, val]) => val !== undefined)
        )
        return {
            keyPair: newConvoKeyPair,
            encodedKeyPair,
            encryptedKeysForUsers
        }
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const getNewMemberKeys = (
    newMembers: UserConversationProfile[],
    secretKey: Uint8Array,
) => {
    try {
        const idMap = Object.fromEntries(
            newMembers
                .filter((nm) => nm.publicKey !== undefined)
                .map((nm) => {
                    if (!nm.publicKey) return [nm.id, undefined];
                    const decodedPublicKey = decodeKey(nm.publicKey);
                    return [
                        nm.id, 
                        encryptJSON(secretKey, {
                            secretKey: encodeKey(secretKey)
                        }, decodedPublicKey)
                    ]
                })
        ) as { [id: string]: string };
        return idMap;
    } catch (err) {
        console.log(err);
        return {};
    }
}

export const decodeKey = (key: string): Uint8Array => {
    try {
        const decoded = decodeBase64(key)
        return decoded;
    } catch (err) {
        console.log('decoding error')
        console.log(key);
        console.log(err);
    }
    return new Uint8Array();
};

export const encodeKey = (key: Uint8Array) => {
    try {
        const encoded = encodeBase64(key)
        return encoded;
    } catch (err) {
        console.log('encoding error')
        console.log(key);
        console.log(err);
    }
    return '';
};
