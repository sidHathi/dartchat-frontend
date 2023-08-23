import { parseSocketMessage, parseSocketEvent, parseConversation } from "./requestUtils";
import { Message, SocketEvent, Conversation, DecryptedMessage, UserData, UserConversationProfile, ConversationPreview, ChatRole } from '../types/types';
import secureStore from "../localStore/secureStore";
import { decodeKey, decryptString } from "./encryptionUtils";
import { getStoredUserData, storeUserData } from "../localStore/store";
import { PNPacket } from "../types/types";
import { constructPreviewForConversation, handlePossiblyEncryptedMessage } from "./messagingUtils";

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

export const parsePNRC = (stringifiedBody: string | undefined): {
    cid: string,
    newRole: ChatRole
} | undefined => {
    if (!stringifiedBody) return undefined;
    try {
        const parsed = JSON.parse(stringifiedBody);
        if ('cid' in parsed && 'newRole' in parsed) {
            return parsed as {
                cid: string,
                newRole: ChatRole
            }
        }
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const parsedPNDelete = (stringifiedBody: string | undefined):{
    cid: string,
    mid: string
} | undefined => {
    if (!stringifiedBody) return undefined;
    try {
        const parsed = JSON.parse(stringifiedBody);
        if ('cid' in parsed && 'mid' in parsed) {
            return parsed as {
                cid: string,
                mid: string
            }
        }
    } catch (err) {
        console.log(err);
        return undefined;
    }
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

export const handleBackgroundConversationInfo = async (newConvo: Conversation) => {
    try {
        const storedUser = await getStoredUserData();
        if (!storedUser) return;
        const constructedPreview = constructPreviewForConversation(newConvo, storedUser?.id);
        if (!constructedPreview) return;
        const updatedUser: UserData = {
            ...storedUser,
            conversations: [
                constructedPreview,
                ...(storedUser.conversations || [])
            ]
        };
        await storeUserData(updatedUser);
    } catch (err) {
        console.log(err);
    }
};

export const getPossiblyDecryptedMessageContents = (decryptedMessage: DecryptedMessage) => {
    try {
        if (decryptedMessage && decryptedMessage.content.length > 0) {
            return decryptedMessage.content;
        } else if (decryptedMessage && decryptedMessage.media) {
            return 'Media';
        }
        return undefined;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const getEncryptedDisplayFields = async (notif: PNPacket, secretKey?: Uint8Array): Promise<{
    title: string;
    body: string;
    imageUri?: string;
} | undefined> => {
    try {
        switch (notif.type) {
            case 'message':
                const messageData = parsePNMessage(notif.stringifiedBody);
                if (!messageData) return;
                const encryptedMessage = messageData.message || undefined;
                if (!encryptedMessage) return undefined;
                const decrypted = handlePossiblyEncryptedMessage(encryptedMessage, secretKey);
                if (decrypted?.messageType === 'system') return;
                if (!decrypted) return undefined;
                const storedUserData = await getStoredUserData();
                const storedPreview = storedUserData?.conversations?.find((c) => c.cid === messageData.cid);
                if (!storedUserData || !storedPreview) return undefined;
                const mentionFields = extractMentionNotification(decrypted, storedUserData.id, storedPreview);
                if (mentionFields) {
                    return mentionFields;
                }
                const decryptedContents = getPossiblyDecryptedMessageContents(decrypted);
                if (decryptedContents) {
                    return {
                        title: storedPreview.name,
                        body: decryptedContents,
                        imageUri: storedPreview.avatar?.tinyUri
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
};

export const extractMentionNotification = (message: DecryptedMessage, storedUid: string, storedPreview?: ConversationPreview) => {
    if (!message.mentions || !storedPreview) return undefined;
    try {
        let constructedNotifBody: string | undefined = undefined;
        const sender = message.senderProfile;
        message.mentions.forEach((m) => {
            if (m.id === storedUid) {
                if (storedPreview && sender) {
                    constructedNotifBody = `${sender.displayName} mentioned you in ${storedPreview.name}`;
                }
            }
        });
        if (constructedNotifBody) {
            return {
                title: storedPreview.name,
                body: constructedNotifBody,
                imageUri: storedPreview.avatar?.tinyUri
            }
        }
        return undefined;
    } catch (err) {
        console.log(err);
        return undefined
    }
};
