import React, { useContext, useMemo } from 'react';
import { Box, HStack, Heading, Spacer } from 'native-base';
import IconButton from '../generics/IconButton';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import ProfileImage from '../generics/ProfileImage';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { userConversationsSelector } from '../../redux/slices/userConversationsSlice';

export default function ChatHeader({
    convoName,
    onSettingsOpen,
    onProfileOpen,
    onConvoExit,
}: {
    convoName: string,
    onSettingsOpen: () => void,
    onProfileOpen: () => void,
    onConvoExit: () => void
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { userConversations } = useAppSelector(userConversationsSelector);

    const profileImage = useMemo(() => {
        if (!user || !currentConvo) {
            return <IconButton label='profile' size={30} additionalProps={{marginX: '6px'}} onPress={onProfileOpen}/>
        }
        const matchingProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingProfiles.length < 1 || !matchingProfiles[0].avatar) {
            return <IconButton label='profile' size={30} additionalProps={{marginX: '6px'}} onPress={onProfileOpen}/>
        }
        return <ProfileImage imageUri={matchingProfiles[0].avatar.tinyUri} size={30} onPress={onProfileOpen} nbProps={{mx: '6px'}}/>
    }, [user, currentConvo, onProfileOpen]);

    const chatAvatar = useMemo(() => {
        if (!currentConvo || !userConversations) return;

        if (!currentConvo.group && user) {
            const otherParticipants = currentConvo.participants.filter((p) => p.id !== user.id);
            if (otherParticipants.length > 0 && otherParticipants[0].avatar) {
                return <ProfileImage imageUri={otherParticipants[0].avatar.tinyUri}  size={30} />
            }
        }
        const matchingUserConvos = userConversations.filter((p) => p.cid === currentConvo.id);
        if (matchingUserConvos.length < 1 || !matchingUserConvos[0].avatar) {
            return <IconButton label='profile' size={30} />
        }
        return <ProfileImage imageUri={matchingUserConvos[0].avatar.tinyUri}  size={30} />
    }, [userConversations, currentConvo]);

    const chatName = useMemo(() => {
        if (!currentConvo || !user) return ''
        if (currentConvo.group) return currentConvo.name;
        const otherUsers = currentConvo.participants.filter((p) => p.id !== user.id);
        if (otherUsers.length > 0) return otherUsers[0].displayName;
        return '';
    }, [currentConvo, user])

    return <Box backgroundColor='#111' borderBottomRightRadius='24px' h='90px' zIndex='999'>
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
                profileImage
            }
            </Box>
        </HStack>
    </Box>;
}
