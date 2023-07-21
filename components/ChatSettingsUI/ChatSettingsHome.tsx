import React, { useState, useMemo, useCallback, useContext } from 'react';
import { View, Center, Box, Button, Text, Heading, HStack, Input } from 'native-base';
import ProfileImage from '../generics/ProfileImage';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { chatSelector, updateConversationDetails } from '../../redux/slices/chatSlice';
import IconButton from '../generics/IconButton';
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import { selectProfileImage } from '../../utils/identityUtils';
import { getDownloadUrl, storeConversationAvatar } from '../../firebase/cloudStore';
import { AvatarImage } from '../../types/types';
import useRequest from '../../requests/useRequest';
import { handleUpdatedChat } from '../../redux/slices/userConversationsSlice';
import Spinner from 'react-native-spinkit';
import SocketContext from '../../contexts/SocketContext';
import ButtonGrid, { ButtonLabel } from './ButtonGrid';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import { ChatSettingsPanel } from './ChatSettingsController';
import { MenuPage } from './ExpandedSettingsMenu';

export default function ChatSettingsHome({
    setSettingsPanel,
    openExpandedView
}: {
    setSettingsPanel: (newPanel: ChatSettingsPanel) => void;
    openExpandedView : (page: MenuPage) => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();

    const [nameAvatarEditing, setNameAvatarEditing] = useState(false);
    const [newName, setNewName] = useState<string | undefined>();
    const [newAvatar, setNewAvatar] = useState<Image | undefined>();
    const [nameAvatarEdited, setNameAvatarEdited] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    const convoName: string = useMemo(() => {
        if (currentConvo && currentConvo.group) {
            return currentConvo.name || 'Unnamed chat'
        } else if (currentConvo && user) {
            const otherMembers = currentConvo.participants.filter((p) => p.id !== user.id);
            if (otherMembers.length > 0) return otherMembers[0].displayName;
            return 'Private Chat'
        }
        return 'Unnamed chat';
    }, [currentConvo])

    const currConvoAvatar = useMemo(() => {
        if (currentConvo?.group) {
            if (newAvatar?.sourceURL || currentConvo?.avatar) {
                return <ProfileImage imageUri={newAvatar ? `file://${newAvatar.path}` : currentConvo?.avatar?.mainUri || ''} shadow='9' size={100} />;
            }
            return <IconButton size={100} label='profile' />;
        } else if (currentConvo && user) {
            const otherProfiles = currentConvo.participants.filter((p) => p.id !== user.id);
            if (otherProfiles.length > 0 && otherProfiles[0].avatar) {
                return <ProfileImage imageUri={otherProfiles[0].avatar.mainUri || ''} shadow='9' size={100} />;
            }
        }
        return <IconButton size={100} label='profile' />;
    }, [currentConvo, newAvatar]);

    const selectImage = async () => {
        await selectProfileImage(setNewAvatar, setNameAvatarEdited);
    };

    const onButtonSelect = (buttonLabel: ButtonLabel) => {
        switch (buttonLabel) {
            case 'notifications':
                setSettingsPanel('notifications');
                break;
            case 'members':
                openExpandedView('members');
                break;
            default:
                return;
        }
    };

    const getUploadedAvatar = useCallback(async () => {
        if (currentConvo && newAvatar && newAvatar.path) {
            setImageUploading(true);
            try {
                const { 
                    mainTask, 
                    tinyTask,
                    mainLoc,
                    tinyLoc,
                } = await storeConversationAvatar(currentConvo.id, newAvatar.path, newAvatar.sourceURL);

                await tinyTask;
                await mainTask;
                const mainUri =  await getDownloadUrl(mainLoc);
                const tinyUri = await getDownloadUrl(tinyLoc);
                const avatar: AvatarImage = {
                    tinyUri,
                    mainUri,
                };
                setImageUploading(false);
                return avatar;
            } catch (err) {
                console.log(err);
                setImageUploading(false);
            }
        }
    }, [currentConvo, newAvatar]);

    const onSaveNameAvatar = useCallback(async () => {
        // this should only happen for groupchats -> need to gate
        const updates: any = {
            newAvatar: undefined,
            newName: undefined
        }
        if (newAvatar) {
            setImageUploading(true);
            updates.newAvatar = await getUploadedAvatar();
        }
        if (newName) {
            updates.newName = newName;
        }
        if (updates.newName || updates.newAvatar) {
            dispatch(updateConversationDetails(updates, conversationsApi, () => {
                dispatch(handleUpdatedChat({cid: currentConvo?.id, ...updates}));
                socket && socket.emit('updateConversationDetails')
            }));
        }
        setImageUploading(false);
        setNameAvatarEditing(false);
    }, [currentConvo, newAvatar, newName])

    return <Box style={{
            shadowOpacity: 0.24
        }} px='12px' py='24px' bgColor='white' shadow='9' w='96%' borderRadius='24px' mx='auto' mt='12px'>
        <Center w='100%'>
            {
                nameAvatarEditing &&
                <View h='0px' w='100%' overflow='visible'
                zIndex='1004'>
                    <Box h='100px' w='100%' overflow='visible'>
                        <Center w='100%' overflow='visible'>
                        <Button colorScheme='coolGray' mt='40px' borderRadius='24px' px='12px' variant='solid' onPress={selectImage} py='6px' opacity='0.7' flexShrink='0'>
                            <Text fontSize='9px' color='#f5f5f5' fontWeight='medium'>
                                Change profile image
                            </Text>
                        </Button>
                        </Center>
                    </Box>
                </View>
            }
            <Box m='auto' mb='6px' zIndex='1001'>
                {currConvoAvatar}
            </Box>
            <HStack my='6px' space={2}>
                {
                    nameAvatarEditing ?
                    <Input
                        placeholder={convoName}
                        value={newName}
                        onChangeText={(newText: string) => {
                            setNewName(newText);
                            setNameAvatarEdited(true);
                        }}
                        minWidth='200px'
                        h='40px'
                        px='4px'
                        marginRight='8px'
                        variant="underlined"
                        fontWeight='bold'
                        fontSize='md'
                        bgColor='#fefefe'
                        my='6px'
                        textAlign='center'
                    /> :
                    <Heading fontSize='xl'>
                        {convoName}
                    </Heading>
                }
            </HStack>
            {
                currentConvo && currentConvo.group &&
                (
                    imageUploading ?
                    <Spinner type='Pulse' /> :
                    <Button py='3px' colorScheme={nameAvatarEditing ? 'dark' : 'light'} mx='auto' px='24px' borderRadius='24px' variant='subtle' mt='6px'
                    onPress={() => {
                        nameAvatarEditing ? onSaveNameAvatar() : setNameAvatarEditing(!nameAvatarEditing)
                    }}>
                        <Text fontSize='11px' color={nameAvatarEditing ? 'white': 'coolGray.600'} fontWeight={nameAvatarEditing ? 'bold': 'medium'}>
                            {!nameAvatarEditing ? 'Edit profile and name' : 
                                nameAvatarEdited ? 'Save' : 'Cancel'}
                        </Text>
                    </Button>
                )
            }
        </Center>

        <ButtonGrid onButtonSelect={onButtonSelect}/>
    </Box>
}
