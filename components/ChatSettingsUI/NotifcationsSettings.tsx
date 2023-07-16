import React, { useContext, useMemo } from 'react';
import { Box, Button, HStack, Heading, Icon, Center, Text } from 'native-base';
import IconButton from '../generics/IconButton';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { chatSelector, updateUserNotStatus } from '../../redux/slices/chatSlice';
import { userConversationsSelector } from '../../redux/slices/userConversationsSlice';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import { NotificationStatus } from '../../types/types';
import { MaterialIcons } from '@expo/vector-icons';
import useRequest from '../../requests/useRequest';
import Spinner from 'react-native-spinkit';

export default function NotificationsSettings({
    exit
}: {exit: () => void}): JSX.Element {
    const dispatch = useAppDispatch();
    const { requestLoading } = useAppSelector(chatSelector);
    const { currentConvo } = useAppSelector(chatSelector);
    const { user } = useContext(AuthIdentityContext);
    const { conversationsApi } = useRequest();
    
    const selectedButton = useMemo((): NotificationStatus | undefined => {
        if (!currentConvo || !user) return undefined;
        const matchingUserProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingUserProfiles.length > 0) return matchingUserProfiles[0].notifications;
        return undefined;
    }, [user, currentConvo]);

    const onSelect = (setting: NotificationStatus) => {
        // send message to the api indicating tha the change needs to be made -> on success update redux
        if (!user || requestLoading || setting === selectedButton) return;
        dispatch(updateUserNotStatus(user.id, setting, conversationsApi));
    };

    const descriptorText = useMemo(() => {
        switch(selectedButton) {
            case 'all':
                return 'all messages';
            case 'mentions':
                return 'messages where you are mentioned';
            case 'none':
                return 'no messages';
            default:
                return 'all messages';
        }
    }, [selectedButton]);

    return <Box w='96%' mx='auto' bgColor='white' borderRadius='12px' shadow='9' p='24px' mt='12px' style={{shadowOpacity: 0.18}}>
        <HStack space={2}>
            <IconButton label='back' color='black' size={18} shadow='none' additionalProps={{mt: '2px'}} onPress={exit}/>
            <Heading fontSize='lg'>Notifications</Heading>
        </HStack>
        <Button.Group isAttached borderRadius='24px' w='100%' mt='12px'>
            <Button colorScheme='dark' w='33%' variant={!selectedButton || selectedButton === 'all' ? 'subtle' : 'solid'}
            leftIcon={<Icon as={MaterialIcons} name="notifications-active" size="sm" />} onPress={() => onSelect('all')}>
                All
            </Button>
            <Button colorScheme='dark' w='33%'  variant={selectedButton === 'mentions' ? 'subtle' : 'solid'}
            leftIcon={<Icon as={MaterialIcons} name="notification-important" size="sm" />} onPress={() => onSelect('mentions')}>
                Mentions
            </Button>
            <Button colorScheme='dark' w='33%' variant={selectedButton === 'none' ? 'subtle' : 'solid'}
            leftIcon={<Icon as={MaterialIcons} name="notifications-off" size="sm" />} onPress={() => onSelect('none')}>
                None
            </Button>
        </Button.Group>
        <Text fontSize='xs' mt='6px' mx='auto'>
            You will be notified about <Text fontWeight='bold' fontSize='xs'>{descriptorText}</Text>
        </Text>
        {
            requestLoading &&
            <Center w='100%'><Spinner type='ThreeBounce' color='black' /></Center>
        }
    </Box>
}
