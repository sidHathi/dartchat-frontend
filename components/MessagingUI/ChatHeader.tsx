import React, { useContext } from 'react';
import { Box, HStack, Heading, Spacer } from 'native-base';
import IconButton from '../generics/IconButton';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import ProfileImage from '../generics/ProfileImage';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';

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

    const getProfileImage = () => {
        if (!user || !currentConvo) {
            return <IconButton label='profile' size={33} additionalProps={{marginX: '6px'}} onPress={onProfileOpen}/>
        }
        const matchingProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingProfiles.length < 1 || !matchingProfiles[0].avatar) {
            return <IconButton label='profile' size={33} additionalProps={{marginX: '6px'}} onPress={onProfileOpen}/>
        }
        return <ProfileImage imageUri={matchingProfiles[0].avatar.tinyUri} size={33} onPress={onProfileOpen} nbProps={{mx: '6px'}}/>
    };

    return <Box backgroundColor='#111' borderBottomRightRadius='24px' h='90px' zIndex='999'>
        <HStack paddingTop='50px' marginX='6px' space={2}>
            <IconButton label='back' size={24} additionalProps={{marginX: '4px', mt: '5px'}} onPress={onConvoExit}/>
            <Heading fontSize='md' color='white' paddingTop='8px'>
                {convoName || 'Chat'}
            </Heading>
            <Spacer />
            {/* <IconButton label='settings' size={24} additionalProps={{marginX: '6px', mt: '5px'}} onPress={onSettingsOpen}/> */}
            {
                getProfileImage()
            }
        </HStack>
    </Box>;
}
