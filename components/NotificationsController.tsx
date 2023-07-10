import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { AppState } from 'react-native';
import useRequest from '../requests/useRequest';
import { chatSelector, pullConversation } from '../redux/slices/chatSlice';
import { getUserData } from '../utils/identityUtils';
import { setConversations } from '../redux/slices/userConversationsSlice';
import { getBackgroundUpdateFlag, setBackgroundUpdateFlag } from '../localStore/store';
import messaging from '@react-native-firebase/messaging';

export default function NotificationsController(): JSX.Element {
    const dispatch = useAppDispatch();
    const { conversationsApi, usersApi } = useRequest();
    const { currentConvo } = useAppSelector(chatSelector);
    
    useEffect(() => { 
        const eventListener = AppState.addEventListener('change', async (nextState) => {
            if (nextState === 'active' && (await getBackgroundUpdateFlag())) {
                try {
                    console.log('pulling notification updates');
                    if (currentConvo) {
                        dispatch(pullConversation(currentConvo.id, conversationsApi));
                    }
                    const userData = await getUserData(usersApi);
                    if (userData && userData.conversations) {
                        dispatch(setConversations(userData?.conversations));
                    }
                    await setBackgroundUpdateFlag(false);
                } catch (err) {
                    console.log(err);
                }
            }
        });

    return () => {
        eventListener.remove();
    };
    }, []);

    useEffect(() => {
        const addPushToken = async () => {
            console.log('adding push token');
            try {
                const token = await messaging().getToken();
                if (token) {
                    await usersApi.addUserPushToken(token);
                }
                console.log('added');
            } catch (err) {
                console.log(err);
            }
        }
        addPushToken();
    }, []);

    return <></>;
}
