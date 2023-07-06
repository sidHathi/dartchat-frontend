import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth'
import uuid from 'react-native-uuid';
import { FirebaseStorageTypes } from '@react-native-firebase/storage'
import { UserData } from '../types/types';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { Image } from 'react-native';

export const uploadTimeoutInSeconds: number = 300;

export const createTinyProfileImage = async (filePath: string, fileUri?: string): Promise<string | never> => {
    try {
        const res = await ImageResizer.createResizedImage(
            fileUri || `file://${filePath}`,
            100,
            100,
            'JPEG',
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

export const getDownloadUrl = (refLoc: string) => storage().ref(refLoc).getDownloadURL();

export const storeMessagingImage = async (filePath: string): Promise<{
    task: FirebaseStorageTypes.Task,
    loc: string
}> => {
    try {
        const id: string = uuid.v4().toString();
        const ref = storage().ref(`messagingMedia/${id}.jpg`);
        return {
            task: ref.putFile(filePath),
            loc: `userProfileImages/${id}.jpg`
        }
    } catch (err) {
        return Promise.reject(err);
    }
};

