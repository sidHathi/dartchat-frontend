import { ConversationsApi } from '../requests/conversationsApi';
import { Conversation, Message } from '../types/types';
import { decodeKey, decryptJSON, decryptString, encodeKey, encryptJSON, encryptString, getNewMemberKeys } from './encryptionUtils';

export type Reencryptor = {
    api: ConversationsApi | null;
    convo: Conversation | null;
    oldSecretKey: Uint8Array | null;
    encryptionData: {
        minDate: Date;
        data: {
            id: string;
            encryptedFields: string;
            publicKey: string;
        }[];
    } | null;
    reencryptedData: {
        minDate: Date;
        data: {
            id: string;
            encryptedFields: string;
            publicKey: string;
        }[];
    } | null;
    init: (convo: Conversation, api: ConversationsApi) => Reencryptor;
    pullEncryptedData: (dateLimit?: Date) => Promise<void | never>;
    reencrypt: (
        oldSecretKey: Uint8Array,
        newKeys: {
            secretKey: Uint8Array,
            publicKey: Uint8Array
        }
    ) => Promise<{ [id: string]: string } | undefined>;
    commit: () => Promise<void | never>;
    cancel: () => Promise<void | never>;
};

const reencryptor: Reencryptor = {
    api: null,
    convo: null,
    encryptionData: null,
    oldSecretKey: null,
    reencryptedData: null,
    init(convo: Conversation, api: ConversationsApi) {
        this.convo = convo;
        this.api = api;
        return this;
    },
    async pullEncryptedData(dateLimit) {
        try {
            if (!this.api || !this.convo) return;
            this.encryptionData = await this.api.getEncryptionData(this.convo.id, dateLimit)
        } catch (err) {
            console.log(err);
            return;
        }
    },
    async reencrypt(oldSecretKey, newKeys) {
        try {
            if (!this.api || !this.convo || !this.encryptionData) return;
            this.oldSecretKey = oldSecretKey;
            this.reencryptedData = {
                minDate: this.encryptionData.minDate,
                data: this.encryptionData.data.map((messageData) => {
                    const decryptedFields = decryptString(oldSecretKey, messageData.encryptedFields, decodeKey(messageData.publicKey));
                    const reencryptedFields = encryptString(newKeys.secretKey, decryptedFields, newKeys.publicKey);
                    return {
                        id: messageData.id,
                        encryptedFields: reencryptedFields,
                        publicKey: encodeKey(newKeys.publicKey)
                    }
                })
            };
            const userKeyMap = getNewMemberKeys(this.convo.participants, newKeys.secretKey);
            await this.api.changeEncryptionKey(this.convo.id, encodeKey(newKeys.publicKey), userKeyMap);
            return userKeyMap;
        } catch (err) {
            console.log(err);
            return;
        }
    },
    async commit() {
        if (!this.convo || !this.api || !this.reencryptedData) return;
        await this.api.pushReencryptedMessages(this.convo.id, this.reencryptedData);
        return;
    },
    async cancel() {
        if (!this.convo || !this.convo.publicKey || !this.api || !this.oldSecretKey) return;
        const userKeyMap = getNewMemberKeys(this.convo.participants, this.oldSecretKey);
        await this.api.changeEncryptionKey(this.convo.id, this.convo.publicKey, userKeyMap);
        return;
    }
};

export default reencryptor;
