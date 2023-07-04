import React from 'react';
import { Box, HStack, Heading, Spacer } from 'native-base';
import IconButton from '../generics/IconButton';

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
    return <Box backgroundColor='#222' borderBottomRightRadius='24px' h='90px' zIndex='999'>
        <HStack paddingTop='50px' marginX='6px'>
            <IconButton label='back' size={24} additionalProps={{marginX: '4px', mt: '5px'}} onPress={onConvoExit}/>
            <Heading fontSize='md' color='white' paddingTop='8px'>
                {convoName || 'Chat'}
            </Heading>
            <Spacer />
            <IconButton label='settings' size={24} additionalProps={{marginX: '6px', mt: '5px'}} onPress={onSettingsOpen}/>
            <IconButton label='profile' size={33} additionalProps={{marginX: '6px'}} onPress={onProfileOpen}/>
        </HStack>
    </Box>;
}
