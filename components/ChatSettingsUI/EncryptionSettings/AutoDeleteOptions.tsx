import React, { useContext, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { chatSelector, setMessageDisappearTime } from '../../../redux/slices/chatSlice';
import UIContext from '../../../contexts/UIContext';
import { current } from '@reduxjs/toolkit';
import useRequest from '../../../requests/useRequest';
import { Box, Button, Spacer, Text, VStack, HStack, Center, Switch, Select, CheckIcon } from 'native-base';
import colors from '../../colors';
import AuthIdentityContext from '../../../contexts/AuthIdentityContext';
import SocketContext from '../../../contexts/SocketContext';

export default function AutoDeleteOptions(): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { theme } = useContext(UIContext);
    const { conversationsApi } = useRequest();
    const { socket } = useContext(SocketContext);

    const hasPermission = useMemo(() => {
        if (!currentConvo || !user) return false;

        const userProfile = currentConvo.participants.find((p) => p.id === user.id)
        if (!userProfile || userProfile.role !== 'admin') return false;
        return true;
    }, [user, currentConvo]);

    const autoDeleteEnabled = useMemo(() => {
        if (currentConvo?.messageDisappearTime !== undefined && currentConvo.messageDisappearTime !== 0) {
            return true;
        }
        return false;
    }, [currentConvo]);

    const setNewDisappearTime = useCallback(async (newTime: number | null) => {
        if (!currentConvo) return;
        try {
            if (newTime != null && newTime < 6) {
                return;
            }
            dispatch(setMessageDisappearTime(newTime, conversationsApi, () => {
                socket && socket.emit('messageDisappearTimeChanged', currentConvo.id, newTime);
            }));
        } catch (err) {
            console.log(err);
        }
    }, [conversationsApi, currentConvo, socket]);

    const onToggleDisappear = useCallback(async () => {
        if (!currentConvo) return;
        if (autoDeleteEnabled) {
            dispatch(setMessageDisappearTime(null, conversationsApi, () => {
                socket && socket.emit('messageDisappearTimeChanged', currentConvo.id, null);
            }));
        } else {
            dispatch(setMessageDisappearTime(12, conversationsApi, () => {
                socket && socket.emit('messageDisappearTimeChanged', currentConvo.id, 12);
            }));
        }
    }, [setNewDisappearTime, autoDeleteEnabled, conversationsApi, socket, currentConvo]);

    const selectVal = useMemo(() => {
        if (!autoDeleteEnabled || !currentConvo) return 0;
        else {
            return currentConvo.messageDisappearTime;
        }
    }, [currentConvo, autoDeleteEnabled]);

    if (!hasPermission) {
        return <></>;
    }

    return <Box w='100%' mx='auto' bgColor={colors.message[theme]} borderRadius='24px' p='24px' mt='6px'>
        <HStack w='100%'>
            <VStack space='1' w='80%'>
                <Text fontSize='xs' color={colors.textLightNB[theme]}>
                    Disappearing messages
                </Text>
                <Text fontSize='xs'  color={colors.textMainNB[theme]}>
                    By enabling this feature, all messages in this chat will be permanently removed from all records after their expiration time.
                </Text>
            </VStack>
            <Spacer />
            <Switch
                my='auto'
                size='sm'
                offTrackColor='gray.500'
                onTrackColor='gray.900'
                isChecked={autoDeleteEnabled}
                onToggle={onToggleDisappear}
            />
        </HStack>
        {
            autoDeleteEnabled &&
            <Box w='100%'>
                 <Select fontWeight='bold'
                selectedValue={selectVal?.toString() || '12'} w='100%' h='36px' borderRadius='24px' accessibilityLabel="Choose message expiration time" placeholder="Choose message expiration time" borderWidth='0px' bgColor={colors.select[theme]} color={colors.textMainNB[theme]} px='24px' mt='12px'
                _selectedItem={{
                    color: colors.textMainNB[theme],
                    fontWeight: 'bold',
                    borderRadius: '30px',
                    bg: "#f1f1f1",
                    endIcon: <CheckIcon size="5" />
                }}
                onValueChange={itemValue => setNewDisappearTime(parseInt(itemValue))}>
                    <Select.Item label="12 hrs" value={'12'} />
                    <Select.Item label="1 day" value={'24'} />
                    <Select.Item label="1 week" value={`${24*7}`} />
                    <Select.Item label="1 month" value={`${24*30}`} />
                </Select>
            </Box>
        }
    </Box>;
}
