import React, { useState, useContext, useEffect, useMemo } from 'react';
import {Asset, launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import { View, Center, HStack, VStack, Input, Text, Spacer, Box, Button, Progress } from 'native-base';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

import IconButton from '../generics/IconButton';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import { KeyboardTypeOptions } from 'react-native';
import IconImage from '../generics/IconImage';
import { storeProfileImage, getDownloadUrl } from '../../firebase/cloudStore';
import { AvatarImage, UserData } from '../../types/types';
import { selectProfileImage } from '../../utils/identityUtils';

export default function ProfileEditor({
    handleExit
}: {
    handleExit: () => void;
}) : JSX.Element {
    const { user, modifyUser } = useContext(AuthIdentityContext);
    
    const [handle, setHandle] = useState<string | undefined>(undefined);
    const [displayName, setDisplayName] = useState<string | undefined>(undefined);
    const [phone, setPhone] = useState<string | undefined>(undefined);
    const [selectedProfile, setSelectedProfile] = useState<Image | undefined>(undefined);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);

    useEffect(() => {
        if (!user) return;
        setHandle(user.handle);
        setDisplayName(user.displayName);
        setPhone(user.phone);
    }, []);

    const editField = ({value, setValue, prompt, keyboardType}: {
        value: string | undefined;
        setValue: (newVal: string) => void;
        prompt: string;
        keyboardType?: KeyboardTypeOptions;
    }): JSX.Element => {
        return <Box w='100%'>
            <Text fontSize='11px' color='coolGray.600'>
                {prompt}
            </Text>
            <Input
                placeholder={prompt}
                value={value}
                onChangeText={setValue}
                w='100%'
                h='40px'
                px='4px'
                marginRight='8px'
                variant="underlined"
                keyboardType={keyboardType}
                fontWeight='bold'
                fontSize='md'
                bgColor='#f1f1f1'
                my='6px'
            />
        </Box>
    };

    const getUpdatedUserInfo = (): UserData | undefined => { 
        if (!user) return undefined;
        return {
            ...user,
            handle,
            displayName,
            phone,
            conversations: [],
        }
    };

    const updateUserProfile = async (avatarUri?: AvatarImage) => {
        const updates = getUpdatedUserInfo()
        if (!updates) return;
        const updatedUserInfo = {
            ...updates,
            avatar: avatarUri
        };
        try {
            await modifyUser(updatedUserInfo);
        } catch (err) {
            console.log(err);
        }
    };

    const constructedProfileUri = useMemo(() => {
        return selectedProfile ? `file://${selectedProfile.path}` : undefined
    }, [selectedProfile]);

    const onSubmit = async () => {
        if (user && selectedProfile !== undefined && selectedProfile.path) {
            setImageUploading(true);
            const { 
                mainTask, 
                tinyTask,
                mainLoc,
                tinyLoc,
             } = await storeProfileImage(user, selectedProfile.path, selectedProfile.sourceURL);
            mainTask.on('state_changed', (taskSnapshot) => {
                setImageUploadProgress(taskSnapshot.bytesTransferred/taskSnapshot.totalBytes);
            });
            mainTask.then(async () => {
                console.log('image uploaded');
                await tinyTask;
                setImageUploading(false);
                const mainUri = await getDownloadUrl(mainLoc);
                const tinyUri = await getDownloadUrl(tinyLoc);
                await updateUserProfile({
                    mainUri,
                    tinyUri
                });
            })
        } else if (user) {
            await updateUserProfile();
        }
        handleExit();
    };

    return (
        <View flex='1'>
            <Center w='100%' mt='24px'>
                <HStack px='24px' my='12px'>
                    <Spacer />
                    <TouchableOpacity onPress={handleExit}>
                        <HStack space={2}>
                        <MaterialIcons name="cancel" size={22} color="black" />
                        <Text fontWeight='bold'>Cancel</Text>
                        </HStack>
                    </TouchableOpacity>
                </HStack>
                <Box w='90%' mx='auto' borderRadius='24px' bgColor='#f5f5f5' p='24px' shadow={9}>
                    <Center w='100%' mb='20px' h='90px'>
                            {
                                ((selectedProfile && selectedProfile.sourceURL) || user?.avatar?.mainUri) ?
                                <IconImage imageUri={selectedProfile?.sourceURL || constructedProfileUri || user?.avatar?.mainUri || ''} size={100} shadow='9' /> :
                                <IconButton label='profile' size={100} shadow='9' />
                            }
                            <Button colorScheme='coolGray' m='auto' borderRadius='24px' px='12px' variant='solid'
                            onPress={() => selectProfileImage(setSelectedProfile)} py='6px' opacity='0.7' mt='-60px'>
                                <Text fontSize='9px' color='#f5f5f5' fontWeight='medium'>
                                    Change profile image
                                </Text>
                            </Button>
                    </Center>

                    <VStack space={2} mb='12px'>
                        {editField({
                            value: handle,
                            setValue: setHandle,
                            prompt: 'Edit your handle'
                        })}

                        {editField({
                            value: displayName,
                            setValue: setDisplayName,
                            prompt: 'Edit your display name'
                        })}

                        {editField({
                            value: phone,
                            setValue: setPhone,
                            prompt: 'Edit your phone number'
                        })}

                    </VStack>

                    <Button colorScheme='dark' my='6px' borderRadius='24px' px='24px' variant='subtle' onPress={onSubmit}>
                        <Text fontSize='xs' color='#f5f5f5' fontWeight='medium'>
                            Save changes
                        </Text>
                    </Button>
                    {
                    imageUploading &&
                    <Progress colorScheme='light' value={imageUploadProgress * 100} />
                    }
            </Box>
            </Center>
        </View>
    )
}
