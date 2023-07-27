import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth'
import uuid from 'react-native-uuid';
import { FirebaseStorageTypes } from '@react-native-firebase/storage'
import { MessageMediaBuffer, UserData } from '../types/types';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { Image } from 'react-native';

export const uploadTimeoutInSeconds: number = 300;

export const createTinyProfileImage = async (filePath: string, fileUri?: string): Promise<string | never> => {
    try {
        const res = await ImageResizer.createResizedImage(
            fileUri || `file://${filePath}`,
            72,
            72,
            'JPEG',
            85,
          );
        return res.path;
    } catch (err) {
        return Promise.reject(err);
    }
};


export const createIcon = async (fileUri: string): Promise<string | never> => {
    try {
        const res = await ImageResizer.createResizedImage(
            fileUri,
            72,
            72,
            'PNG',
            85,
          );
        return res.path;
    } catch (err) {
        return Promise.reject(err);
    }
};

export const storeProfileImage = async (user: UserData, filePath: string, fileUri?: string): Promise<{
    mainTask: FirebaseStorageTypes.Task,
    tinyTask: FirebaseStorageTypes.Task
    mainLoc: string,
    tinyLoc: string
} | never> => {
    try {
        const tinyPath: string = await createTinyProfileImage(filePath, fileUri);
        const id: string = user.id;
        const mainRef = storage().ref(`userProfileImages/${id}.jpg`);
        const tinyRef = storage().ref(`userProfileImages/${id}-tiny.jpg`);
        return {
            mainTask: mainRef.putFile(filePath),
            mainLoc: `userProfileImages/${id}.jpg`,
            tinyTask: tinyRef.putFile(tinyPath),
            tinyLoc: `userProfileImages/${id}-tiny.jpg`,
        }
    } catch (err) {
        return Promise.reject(err);
    }
};

// need function for storing conversation profile images
export const storeConversationProfileImage = async (cid: string, uid: string, filePath: string, fileUri?: string): Promise<{
    mainTask: FirebaseStorageTypes.Task,
    tinyTask: FirebaseStorageTypes.Task
    mainLoc: string,
    tinyLoc: string
} | never> => {
    try {
        const tinyPath: string = await createTinyProfileImage(filePath, fileUri);
        const id: string = `${cid}-${uid}`;
        const mainLoc = `conversationProfiles/${id}.jpg`;
        const tinyLoc = `conversationProfiles/${id}-tiny.jpg`
        const mainRef = storage().ref(mainLoc);
        const tinyRef = storage().ref(tinyLoc);
        return {
            mainTask: mainRef.putFile(filePath),
            mainLoc,
            tinyTask: tinyRef.putFile(tinyPath),
            tinyLoc,
        }
    } catch (err) {
        return Promise.reject(err);
    }
};

export const storeConversationAvatar = async (cid: string, filePath: string, fileUri?: string): Promise<{
    mainTask: FirebaseStorageTypes.Task,
    tinyTask: FirebaseStorageTypes.Task
    mainLoc: string,
    tinyLoc: string
} | never> => {
    try {
        const tinyPath: string = await createTinyProfileImage(filePath, fileUri);
        const mainLoc = `conversationProfiles/${cid}.jpg`;
        const tinyLoc = `conversationProfiles/${cid}-tiny.jpg`
        const mainRef = storage().ref(mainLoc);
        const tinyRef = storage().ref(tinyLoc);
        return {
            mainTask: mainRef.putFile(filePath),
            mainLoc,
            tinyTask: tinyRef.putFile(tinyPath),
            tinyLoc,
        }
    } catch (err) {
        return Promise.reject(err);
    }
};

export const storeLikeIconImages = async (cid: string, imageUris: {
    empty?: string;
    partial?: string;
    active?: string;
}) => {
    try {
        const storageLocs = {
            empty: `likeImages/${cid}/empty.png`,
            partial: `likeImages/${cid}/partial.png`,
            active: `likeImages/${cid}/active.png`,
        }
        return {
            emptyLoc: storageLocs.empty,
            emptyTask: imageUris.empty ? storage().ref(storageLocs.empty).putFile(await createIcon(imageUris.empty)) : undefined,
            partialLoc: storageLocs.partial,
            partialTask: imageUris.partial ? storage().ref(storageLocs.partial).putFile(await createIcon(imageUris.partial)) : undefined,
            activeLoc: storageLocs.active,
            activeTask: imageUris.active ?storage().ref(storageLocs.active).putFile(await createIcon(imageUris.active)) : undefined,
        }
    } catch (err) {
        return Promise.reject(err);
    }
};

export const getDownloadUrl = (refLoc: string) => storage().ref(refLoc).getDownloadURL();

export const storeMessagingImage = (fileUri: string, id: string): {
    task: FirebaseStorageTypes.Task,
    loc: string
} | null => {
    try {
        const ref = storage().ref(`messagingMedia/${id}.jpg`);
        return {
            task: ref.putFile(fileUri),
            loc: `messagingMedia/${id}.jpg`
        }
    } catch (err) {
        return null;
    }
};

export const storeMediaBuffer = (mediaBuffer: MessageMediaBuffer[]) => {
    return mediaBuffer.map(media => {
        if (!media.fileUri) return null;
        return storeMessagingImage(media.fileUri, media.id)
    });
};
