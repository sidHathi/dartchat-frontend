import { DecryptedMessage, UserConversationProfile } from "../types/types";
import Log from "./log";
import Test from "./test";
import uuid from 'react-native-uuid';
import { decryptString, encodeKey, genKeyPair, decodeKey, encryptMessage, decryptMessage, decryptJSON } from "../utils/encryptionUtils";
import { initConvo } from "../utils/messagingUtils";
import { expect, getTextLog } from "../utils/testUtils";
import secureStore from "../localStore/secureStore";

const CreateConversationTest: Test = {
    id: 'createConvoTest1',
    init(params) {
        this.params = params;
        return this;
    },
    name: 'Create conversation test',
    description: 'Creates a new conversation with encrypted keys for sample users, tests that key encryption, key generation, and message encryption/decryption works for the generated conversation.',
    params: {
        user: undefined,
        secretsHandler: async (cid: string, key: Uint8Array) => false,
        forgetConversationKeys: async (cid: string) => false,
    },
    logs: [],
    errors: [],
    run: async function () {
        const { secretsHandler, user, forgetConversationKeys } = this.params;
        if (!secretsHandler || !user?.publicKey || !user?.id) {
            throw new Error('Params missing');
        }

        const userKeyPair2 = genKeyPair();
        const encodedPublicKey2 = encodeKey(userKeyPair2.publicKey);
        const userKeyPair3 = genKeyPair();
        const encodedPublicKey3 = encodeKey(userKeyPair3.publicKey);
        const testUserProfile: UserConversationProfile = {
            displayName: 'testUser1',
            id: uuid.v4().toString(),
            handle: 'testUser1',
            avatar: undefined,
            notifications: 'all',
            publicKey: user.publicKey,
            role: 'admin',
        };
        const selectedProfiles: UserConversationProfile[] = [
            {
                displayName: 'testUser2',
                id: uuid.v4().toString(),
                handle: 'testUser2',
                avatar: undefined,
                notifications: 'all',
                publicKey: encodedPublicKey2,
                role: 'plebian',
            },
            {
                displayName: 'testUser3',
                id: uuid.v4().toString(),
                handle: 'testUser3',
                avatar: undefined,
                notifications: 'all',
                publicKey: encodedPublicKey3,
                role: 'plebian',
            },
        ];

        const { newConvo, recipientKeyMap, secretKey } = await initConvo(
            selectedProfiles,
            testUserProfile,
            'Create convo test group',
            true,
            true,
            true,
        );

        this.logs.push(getTextLog('Conversation created - running tests'));
        await expect('Test: Conversation created with correct keys', this, async () => {
            return newConvo.publicKey !== undefined && 
                recipientKeyMap !== undefined &&
                secretKey !== undefined;
        });
        // Check that keys encrypted for each user
        try {
            await expect('Test: keys encrypted for each user', this, async () => {
                return recipientKeyMap !== undefined && 
                    selectedProfiles[0].id in recipientKeyMap &&
                    selectedProfiles[1].id in recipientKeyMap;
            });
            // Check that keys can be decrypted by each user
            await expect('Test: keys decryptable for each user', this, async () => {
                if (!newConvo.publicKey || !recipientKeyMap || !secretKey) return false;
                const decryptedKey2 = decryptJSON(userKeyPair2.secretKey, recipientKeyMap[selectedProfiles[0].id], decodeKey(newConvo.publicKey));
                const decryptedKey3 = decryptJSON(userKeyPair3.secretKey, recipientKeyMap[selectedProfiles[1].id], decodeKey(newConvo.publicKey));
                if (!('secretKey' in decryptedKey2) || !('secretKey' in decryptedKey3)) return false;
                const encodedSecretKey = encodeKey(secretKey);
                return decryptedKey2.secretKey === encodedSecretKey && decryptedKey3.secretKey === encodedSecretKey;
            });
            // Check that key is stored for new conversation
            await expect('Test: keys stored', this, async () => {
                if (!secretKey) return false;
                await secretsHandler(newConvo.id, secretKey);
                const storedSecretKey = await secureStore.getSecretKeyForKey(user.id, newConvo.id);
                return storedSecretKey !== undefined && encodeKey(storedSecretKey) === encodeKey(secretKey);
            });
            // check that messages sent to conversation can be decrypted by any user
            await expect('Test: messages encryptable and decryptable with new keys', this, async () => {
                if (!newConvo.publicKey || !newConvo.id || !userKeyPair2.secretKey) return false;
                await secretsHandler(newConvo.id, secretKey);
                const message: DecryptedMessage = {
                    id: uuid.v4().toString(),
                    timestamp: new Date(),
                    messageType: 'user',
                    encryptionLevel: 'none',
                    senderId: selectedProfiles[0].id,
                    senderProfile: selectedProfiles[0],
                    likes: [],
                    content: 'test message'
                };
                const decodedPublicKey = decodeKey(newConvo.publicKey)
                const encryptedMessage = encryptMessage(message, userKeyPair2.secretKey, decodedPublicKey);
                const storedSecretKey = await secureStore.getSecretKeyForKey(user.id, newConvo.id);
                if (!storedSecretKey) return false;
                const decryptedMessageByUser = decryptMessage(encryptedMessage, storedSecretKey, decodeKey(encryptedMessage.senderProfile?.publicKey || ''));
                return decryptedMessageByUser?.content !== undefined && decryptedMessageByUser?.content === 'test message';
            });
            
            // Remove keys from app key store
            await forgetConversationKeys(newConvo.id);
        } catch (err) {
            throw err;
        }
    },
};

export default CreateConversationTest;
