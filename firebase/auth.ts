import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export const signUpUser = (email: string, password: string): Promise<never | boolean> => {
    return auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            return Promise.resolve(true);
        })
        .catch((error: FirebaseAuthTypes.NativeFirebaseAuthError) => {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                return Promise.reject(error);
            }
            if (error.code === 'auth/invalid-email') {
                return Promise.reject(error);
            }
            return Promise.reject(error);
        });
};

export const signInUser = (email: string, password: string): Promise<never | boolean> => {
    return auth().signInWithEmailAndPassword(email, password).then(() => {
        return Promise.resolve(true);
    })
    .catch((error: FirebaseAuthTypes.NativeFirebaseAuthError) => {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            return Promise.reject(error);
        }
        if (error.code === 'auth/invalid-email') {
            return Promise.reject(error);
        }
        return Promise.reject(error);
    });
}

export const logOut = () => {
    return auth().signOut()
        .then(() => console.log('User signed out!'));
}
