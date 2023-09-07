import { parseSocketMessage, parseSocketEvent, parseConversation } from "./requestUtils";
import { Message, SocketEvent, Conversation, DecryptedMessage, UserData, UserConversationProfile, ConversationPreview, ChatRole, NotificationStatus } from '../types/types';
import secureStore from "../localStore/secureStore";
import { decodeKey, decryptJSON, decryptString } from "./encryptionUtils";
import { getStoredUserData, storeUserData } from "../localStore/localStore";
import { PNPacket } from "../types/types";
import { constructPreviewForConversation, handlePossiblyEncryptedMessage } from "./messagingUtils";

export const parsePNMessage = (stringifiedBody: string): {
    cid: string;
    mid: string;
} | undefined => {
    try {
        const parsedBody = JSON.parse(stringifiedBody);
        if (!('cid' in parsedBody) || !('mid' in parsedBody)) return undefined;
        return {
            cid: parsedBody['cid'],
            mid: parsedBody['mid']
        };
    } catch (err) {
        console.log(err);
        return undefined;
    }
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
    cid: string,
    keyMap?: any;
} | undefined => {
    const parsedBody = JSON.parse(stringifiedBody);
    if (!('cid' in parsedBody)) return;
    return {
        cid: parsedBody['cid'],
        keyMap: parsedBody.userKeyMap || undefined
    };
};

export const parsePNSecrets = (stringifiedBody: string)  => {
    try {
        const parsedBody = JSON.parse(stringifiedBody);
        if (!('cid' in parsedBody) || !('newPublicKey' in parsedBody) || !('newKeyMap' in parsedBody)) return;

        return {
            cid: parsedBody.cid as string,
            newPublicKey: parsedBody.newPublicKey as string,
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
                const decryptedSecretKeyMap = decryptJSON(userSecretKey, encryptedKeyForUser, decodedPublicKey);
                if (!decryptedSecretKeyMap.secretKey) return;
                await secureStore.addSecureKey(userId, convo.id, decryptedSecretKeyMap.secretKey);
                return decryptedSecretKeyMap.secretKey;
            }
            return undefined;
        }
        return undefined;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const handleBackgroundSecrets = async (cid: string, encodedKeyMap: { [id: string]: string}, encodedPublicKey: string) => {
    try {
        const userData = await getStoredUserData();
        const userId = userData?.id;
        if (userId && userId in encodedKeyMap) {
            const encryptedKeyForUser = encodedKeyMap[userId];
            const userSecretKey = await secureStore.getUserSecretKey(userId);
            if (userSecretKey) {
                const decodedPublicKey = decodeKey(encodedPublicKey);
                const decryptedSecretKeyMap = decryptJSON(userSecretKey, encryptedKeyForUser, decodedPublicKey);
                if (!decryptedSecretKeyMap.secretKey) return;
                await secureStore.addSecureKey(userId, cid, decryptedSecretKeyMap.secretKey);
                return decryptedSecretKeyMap.secretKey;
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

// deprecated after notifications switched to remote triggers
export const getEncryptedDisplayFields = async (notif: PNPacket, secretKey?: Uint8Array, rmId?: string): Promise<{
    title: string;
    body: string;
    imageUri?: string;
    id?: string;
    data?: any;
} | undefined> => {
    try {
        switch (notif.type) {
            case 'message':
                // console.log('mesage notif received');
                const messageData = parsePNMessage(notif.stringifiedBody);
                if (!messageData) return undefined;
                // const encryptedMessage = messageData.message || undefined;
                const encryptedMessage: Message | undefined = undefined;
                if (!encryptedMessage) return undefined;
                const decrypted = handlePossiblyEncryptedMessage(encryptedMessage, secretKey);
                if (decrypted?.messageType === 'system') return;
                if (!decrypted) return undefined;
                const storedUserData = await getStoredUserData();
                const storedPreview = storedUserData?.conversations?.find((c) => c.cid === messageData.cid);
                if (!storedUserData || !storedPreview) return undefined;
                const mentionFields = extractMentionNotification(decrypted, storedUserData.id, storedPreview, rmId);
                const notifStatus = storedPreview?.notfications;
                if (mentionFields !== undefined && notifStatus !== 'none') {
                    return {
                        ...mentionFields,
                        data: {
                            type: 'message',
                            cid: messageData.cid,
                            mid: decrypted.id
                        }
                    };
                } else if (mentionFields === undefined && notifStatus && (notifStatus === 'none' || notifStatus === 'mentions')) {
                    return undefined;
                }
                const decryptedContents = getPossiblyDecryptedMessageContents(decrypted);
                if (decryptedContents) {
                    const showPrefix = (storedPreview.group && decrypted.senderProfile)
                    const bodyPrefix = showPrefix ? `${decrypted.senderProfile?.displayName}: `: '';
                    return {
                        id: rmId || decrypted.id,
                        title: ((!showPrefix && decrypted.senderProfile) ? decrypted.senderProfile?.displayName : storedPreview.name),
                        body: `${bodyPrefix}${decryptedContents}`,
                        data: {
                            type: 'message',
                            cid: messageData.cid,
                            mid: decrypted.id
                        },
                        imageUri: storedPreview.avatar?.tinyUri
                    };
                } else {
                    console.log(decrypted);
                    console.log(await secureStore.getUserSecretKeyStore(storedUserData.id));
                    console.log(storedPreview.cid);
                    return {
                        id: rmId || decrypted.id,
                        title: storedPreview.name || 'New Message',
                        body: `Message contents encrypted`,
                        data: {
                            cid: messageData.cid,
                        }
                    };
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
        if (!storedUserData) {
            console.log('no stored user');
            return undefined;
        }
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
        if ('title' in parsedDisplay) return {
            ...parsedDisplay
        };
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const extractMentionNotification = (message: DecryptedMessage, storedUid: string, storedPreview?: ConversationPreview, rmId?: string) => {
    if (!message.mentions || !storedPreview) return undefined;
    try {
        const sender = message.senderProfile;
        const mention = message.mentions.find((m) => m.id === storedUid);
        if (!mention) return undefined;
        const constructedNotifBody = `${sender?.displayName || 'Someone'} mentioned you in ${storedPreview?.name || 'the chat'}`;
        // console.log(constructedNotifBody);
        return {
            id: rmId || message.id,
            title: storedPreview.name,
            body: constructedNotifBody
        }
    } catch (err) {
        console.log(err);
        return undefined
    }
};
