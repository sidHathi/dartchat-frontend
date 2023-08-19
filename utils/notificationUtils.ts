import { parseSocketMessage, parseSocketEvent, parseConversation } from "./requestUtils";
import { Message, SocketEvent, Conversation } from '../types/types';
import secureStore from "../localStore/secureStore";
import { decodeKey, decryptString } from "./encryptionUtils";
import { getStoredUserData } from "../localStore/store";
import { PNPacket } from "../types/types";
import { handlePossiblyEncryptedMessage } from "./messagingUtils";

export const parsePNMessage = (stringifiedBody: string): {
    cid: string;
    message: Message
} | undefined => {
    const parsedBody = JSON.parse(stringifiedBody);
    if (!('cid' in parsedBody) || !('message' in parsedBody)) return undefined;
    return {
        cid: parsedBody['cid'],
        message: parseSocketMessage(parsedBody)
    };
};

export const parsePNLikeEvent = (stringifiedBody: string): {
    cid: string
    senderId: string;
    event: SocketEvent;
    mid: string;
} | undefined => {
    const parsedBody = JSON.parse(stringifiedBody);
    if (!('senderId' in parsedBody) || 
        !('event' in parsedBody) || 
        !('cid' in parsedBody) ||
        !('mid' in parsedBody)) return undefined;
    return {
        cid: parsedBody['cid'],
        senderId: parsedBody['senderId'],
        event: parseSocketEvent(parsedBody['event']),
        mid: parsedBody['mid']
    };
};

export const parsePNNewConvo = (stringifiedBody: string): {
    convo: Conversation,
    keyMap?: any;
} | undefined => {
    const parsedBody = JSON.parse(stringifiedBody);
    if (!('convo' in parsedBody)) return;
    return {
        convo: parseConversation(parsedBody),
        keyMap: parsedBody.keyMap || undefined
    };
};

export const parsePNSecrets = (stringifiedBody: string)  => {
    try {
        const parsedBody = JSON.parse(stringifiedBody);
        if (!('cid' in parsedBody) || !('newPublicKey' in parsedBody) || !('newKeyMap' in parsedBody)) return;

        return {
            cid: parsedBody.cid,
            newPublicKey: parsedBody.newPublicKey,
            newKeyMap: parsedBody.newKeyMap
        };
    } catch (err) {
        return undefined;
    }
}

export const parsePNDisplay = (stringifiedDisplay: string | undefined): {
    title: string;
    body: string;
    imageUri?: string;
} | undefined => {
    if (!stringifiedDisplay) return undefined;
    const parsed = JSON.parse(stringifiedDisplay);
    if (parsed && 'title' in parsed && 'body' in parsed) {
        return parsed;
    }
    return undefined;
};

export const handleBackgroundConversationKey = async (encodedKeyMap: { [id: string]: string}, convo: Conversation) => {
    try {
        const userData = await getStoredUserData();
        const userId = userData?.id;
        if (userId && userId in encodedKeyMap) {
            const encryptedKeyForUser = encodedKeyMap[userId];
            const userSecretKey = await secureStore.getUserSecretKey(userId);
            if (userSecretKey && convo.publicKey) {
                const decodedPublicKey = decodeKey(convo.publicKey);
                const decryptedSecretKey = decryptString(userSecretKey, encryptedKeyForUser, decodedPublicKey);
                await secureStore.addSecureKey(userId, convo.id, decryptedSecretKey);
                return decryptedSecretKey;
            }
            return undefined;
        }
        return undefined;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const getPossiblyDecryptedMessageContents = (message: Message, secretKey?: Uint8Array) => {
    try {
        const decrypted = handlePossiblyEncryptedMessage(message, secretKey);
        if (decrypted && decrypted.content.length > 0) {
            return decrypted.content;
        } else if (decrypted && decrypted.media) {
            return 'Media';
        }
        return undefined;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const getEncryptedDisplayFields = (notif: PNPacket, secretKey?: Uint8Array): {
    title: string;
    body: string;
    imageUri?: string;
} | undefined => {
    try {
        const body = JSON.parse(notif.stringifiedBody);
        switch (notif.type) {
            case 'message':
                const encryptedMessage = body.message || undefined;
                if (!encryptedMessage) return undefined;
                const decryptedContents = getPossiblyDecryptedMessageContents(encryptedMessage, secretKey);
                if (decryptedContents && body.cName) {
                    return {
                        title: body.cName,
                        body: decryptedContents,
                        imageUri: body.cAvatarImage
                    }
                }
            default:
                const parsedDisplay = parsePNDisplay(notif.stringifiedDisplay);
                return parsedDisplay;
        }
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const getSecureKeyForMessage = async (notif: PNPacket) => {
    try {
        const parsedData = JSON.parse(notif.stringifiedBody);
        if (!('cid' in parsedData)) return undefined;
        const storedUserData = await getStoredUserData();
        if (!storedUserData) return undefined;
        const storedSecretKey = await secureStore.getSecretKeyForKey(storedUserData.id, parsedData.cid);
        return storedSecretKey;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const getUnencryptedDisplayFields = (notif: PNPacket) => {
    if (!notif.stringifiedDisplay) return undefined;
    try {
        const parsedDisplay = JSON.parse(notif.stringifiedDisplay);
        if ('title' in parsedDisplay) return parsedDisplay;
    } catch (err) {
        console.log(err);
        return undefined;
    }
}
