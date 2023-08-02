import { getRandomBytes } from 'expo-crypto';
import { box, setPRNG } from 'tweetnacl';
import { decode as decodeUTF8, encode as encodeUTF8 } from "@stablelib/utf8";
import {
  decode as decodeBase64,
  encode as encodeBase64,
} from "@stablelib/base64";
import { DecryptedMessage, EncryptedMessage, EncryptionFields } from '../types/types';
import { parseSocketMessage } from './requestUtils';
import scrypt from 'react-native-scrypt';
import aes from 'aes-js';

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

const decryptString = (recipientPrivateKey: Uint8Array, messageWithNonce: string, senderPublicKey?: Uint8Array) => {
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
};

export const decryptJSON = (recipientPrivateKey: Uint8Array, messageWithNonce: string, senderPublicKey?: Uint8Array) => {
    return JSON.parse(decryptString(recipientPrivateKey, messageWithNonce, senderPublicKey));
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
        encryptionLevel: message.encryptionLevel,
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
    const decryptedFields: EncryptionFields = decryptJSON(userSecretKey, message.encryptedFields, senderPublicKey);
    const decryptedMessage = parseSocketMessage({
        ...message,
        ...decryptedFields,
    });
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
        return undefined;
    }
};

export const initUserSecretKey = (encryptionKey: string, salt: string, existingKeySet?: JSON) => {
    const keyPair = genKeyPair();
    const b64EncodedSecret = {
        ...existingKeySet,
        userSecretKey: encodeBase64(keyPair.secretKey)
    };
    const aesKey = decodeBase64(encryptionKey);
    const iv = decodeBase64(salt);
    const cbc = new aes.ModeOfOperation.cbc(aesKey, iv);
    const utfEncodedSecret = encodeUTF8(JSON.stringify(b64EncodedSecret, undefined));
    const encryptedSecretKey = cbc.encrypt(utfEncodedSecret);
    return {
        encryptedKeySet: encodeBase64(encryptedSecretKey),
        userKeyPair: keyPair
    };
};

export const decryptUserKeys = (encryptionKey: string, salt: string, encryptedKeySet: string): any => {
    const encryptedKeyBytes = decodeBase64(encryptedKeySet);
    const aesKey = decodeBase64(encryptionKey);
    const iv = decodeBase64(salt);
    const cbc = new aes.ModeOfOperation.cbc(aesKey, iv);
    const decryptedBytes = cbc.decrypt(encryptedKeyBytes);
    return JSON.parse(decodeUTF8(decryptedBytes));
};

export const addEncryptedConversationKey = (cid: string, key: string, encryptedKeySet: string, encryptionKey: string, salt: string): string => {
    const decodedKetSet = decryptUserKeys(encryptionKey, salt, encryptedKeySet);
    const aesKey = decodeBase64(encryptionKey);
    const iv = decodeBase64(salt);
    const cbc = new aes.ModeOfOperation.cbc(aesKey, iv);
    const newKeySet = {
        ...decodedKetSet,
        [cid]: key
    };
    const encodedBytes = encodeUTF8(JSON.stringify(newKeySet));
    const encryptedBytes = cbc.encrypt(encodedBytes);
    return encodeBase64(encryptedBytes);
};

export const getRandomSalt = (): string => {
    const byteArr = getRandomBytes(16);
    return encodeBase64(byteArr);
};

export const decodeKey = (key: string) => decodeBase64(key);

export const encodeKey = (key: Uint8Array) => encodeBase64(key);
