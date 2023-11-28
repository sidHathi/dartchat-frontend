import React, { useContext, useMemo } from 'react';
import { Box, HStack, Heading, Spacer } from 'native-base';
import IconButton from '../generics/IconButton';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import IconImage from '../generics/IconImage';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { userDataSelector } from '../../redux/slices/userDataSlice';
import { Ionicons } from '@expo/vector-icons';
import UIContext from '../../contexts/UIContext';
import colors from '../colors';

export default function ChatHeader({
    convoName,
    onSettingsOpen,
    onProfileOpen,
    onConvoExit,
    profileMenuOpen,
    settingsMenuOpen
}: {
    convoName: string,
    onSettingsOpen: () => void,
    onProfileOpen: () => void,
    onConvoExit: () => void,
    profileMenuOpen: boolean,
    settingsMenuOpen: boolean,
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { userConversations } = useAppSelector(userDataSelector);
    const { theme } = useContext(UIContext);

    const profileImage = useMemo(() => {
        if (!user || !currentConvo) {
            return <IconButton label='profile' size={30} additionalProps={{marginX: '6px'}} onPress={onSettingsOpen}/>
        }
        const matchingProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingProfiles.length < 1 || !matchingProfiles[0].avatar) {
            return <IconButton label='profile' size={30} additionalProps={{marginX: '6px'}} onPress={onSettingsOpen}/>
        }
        return <IconImage imageUri={matchingProfiles[0].avatar.tinyUri} size={30} onPress={onSettingsOpen} nbProps={{mx: '6px'}}/>
    }, [user, currentConvo, onProfileOpen]);

    const expandCollapseButton = useMemo(() => {
        const pressAction = onSettingsOpen;
        const expandIcon = <Ionicons name='caret-down' color='white' size={20} />;
        const closeIcon = <Ionicons name='caret-up' color='white' size={20} />;
        return (
            <TouchableOpacity onPress={onSettingsOpen} style={{marginHorizontal: 12, marginTop: 7}} hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                {
                    (profileMenuOpen || settingsMenuOpen) ?
                    closeIcon :
                    expandIcon
                }
            </TouchableOpacity>
        );
    }, [profileMenuOpen, settingsMenuOpen, onSettingsOpen]);

    const chatAvatar = useMemo(() => {
        if (!currentConvo || !userConversations) return;

        if (!currentConvo.group && user) {
            const otherParticipants = currentConvo.participants.filter((p) => p.id !== user.id);
            if (otherParticipants.length > 0 && otherParticipants[0].avatar) {
                return <IconImage imageUri={otherParticipants[0].avatar.tinyUri}  size={30} />
            }
        }
        const matchingUserConvos = userConversations.filter((p) => p.cid === currentConvo.id);
        if (matchingUserConvos.length < 1 || !matchingUserConvos[0].avatar) {
            return <IconButton label='profile' size={30} />
        }
        return <IconImage imageUri={matchingUserConvos[0].avatar.tinyUri}  size={30} />
    }, [userConversations, currentConvo, user]);

    const chatName = useMemo(() => {
        if (!currentConvo || !user) return ''
        if (currentConvo.group) return currentConvo.name;
        const otherUsers = currentConvo.participants.filter((p) => p.id !== user.id);
        if (otherUsers.length > 0) return otherUsers[0].displayName;
        return '';
    }, [currentConvo, user])

    return <Box backgroundColor={colors.navBG[theme]} borderBottomRightRadius='24px' h='90px' zIndex='999'>
        <HStack paddingTop='50px' marginX='6px' space={4}>
            <IconButton label='back' size={24} additionalProps={{marginX: '4px', mt: '5px'}} onPress={onConvoExit}/>
            <TouchableOpacity onPress={onSettingsOpen}>
                <HStack space={2}>
                    <Box mt='2px'>
                        {
                            chatAvatar
                        }
                    </Box>
                    <Heading fontSize='md' color='white' paddingTop='8px'>
                        {chatName}
                    </Heading>
                </HStack>
            </TouchableOpacity>
            <Spacer />
            {/* <IconButton label='settings' size={24} additionalProps={{marginX: '6px', mt: '5px'}} onPress={onSettingsOpen}/> */}
            <Box mt='2px'>
            {
                expandCollapseButton
            }
            </Box>
        </HStack>
    </Box>;
}
