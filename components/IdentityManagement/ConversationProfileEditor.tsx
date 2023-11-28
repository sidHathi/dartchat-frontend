import React, { useState, useContext, useMemo, useEffect, useCallback } from "react";
import { Box, HStack, Text, Input, Button, Center, VStack, Heading, Spacer } from 'native-base';
import ImagePicker, { Image } from 'react-native-image-crop-picker';

import IconImage from "../generics/IconImage";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import IconButton from "../generics/IconButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, updateConversationProfile } from "../../redux/slices/chatSlice";
import { AvatarImage, UserConversationProfile } from "../../types/types";
import { storeConversationProfileImage, getDownloadUrl } from '../../firebase/cloudStore';
import useRequest from "../../requests/useRequest";
import Spinner from "react-native-spinkit";
import { selectProfileImage } from "../../utils/identityUtils";
import colors from "../colors";
import UIContext from "../../contexts/UIContext";

export default function ConversationProfileEditor({
    handleSave
}: {
    handleSave: () => void;
}) : JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const dispatch = useAppDispatch();
    const { conversationsApi } = useRequest();
    const { theme } = useContext(UIContext);

    const [selectedProfile, setSelectedProfile] = useState<Image | undefined>(undefined);
    const [newDisplayName, setNewDisplayName] = useState<string | undefined>();
    const [edited, setEdited] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    const uploadImages = useCallback(async () => {
        if (user && currentConvo && selectedProfile && selectedProfile.path) {
            setImageUploading(true);
            try {
                const { 
                    mainTask, 
                    tinyTask,
                    mainLoc,
                    tinyLoc,
                } = await storeConversationProfileImage(currentConvo.id, user.id, selectedProfile.path, selectedProfile.sourceURL);

                await tinyTask;
                await mainTask;
                const mainUri =  await getDownloadUrl(mainLoc);
                const tinyUri = await getDownloadUrl(tinyLoc);
                const newAvatar: AvatarImage = {
                    tinyUri,
                    mainUri,
                };
                setImageUploading(false);
                return newAvatar;
            } catch (err) {
                console.log(err);
                setImageUploading(false);
            }
        }
    }, [user, currentConvo, selectedProfile]);

    const onSave = useCallback(async () => {
        if (!currentConvo || !user) return;
        const matches: UserConversationProfile[] = currentConvo.participants.filter((p) => p.id === user.id);
        if (matches.length > 0) {
            const updatedProfile = matches[0]
            if (selectedProfile) {
                updatedProfile.avatar = await uploadImages();
            }
            if (newDisplayName) {
                updatedProfile.displayName = newDisplayName;
            }
            dispatch(updateConversationProfile(updatedProfile, conversationsApi));
            handleSave();
        }
    }, [selectedProfile, newDisplayName, currentConvo, user])

    const currProfile = useMemo(() => {
        if (!user || !currentConvo) {
            return undefined;
        }
        const matchingProfiles = currentConvo.participants.filter((p: UserConversationProfile) => p.id === user.id);
        if (matchingProfiles.length < 1) {
            return undefined;
        }
        return matchingProfiles[0] as UserConversationProfile;
    }, [currentConvo, user]);

    useEffect(() => {
        setNewDisplayName(currProfile?.displayName);
    }, []);

    const editField = ({value, setValue, prompt}: {
        value: string | undefined;
        setValue: (newVal: string) => void;
        prompt: string;
    }): JSX.Element => {
        
        return <Box w='100%'>
            <Text fontSize='11px' color={colors.textLightNB[theme]}>
                {prompt}
            </Text>
            <Input
                placeholder={prompt}
                value={value}
                onChangeText={(newText: string) => {
                    setValue(newText);
                    setEdited(true);
                }}
                w='100%'
                h='40px'
                px='4px'
                marginRight='8px'
                variant="underlined"
                fontWeight='bold'
                fontSize='sm'
                bgColor={colors.inputLight[theme]}
                my='6px'
                color={colors.textMainNB[theme]}
            />
        </Box>
    };

    const constructedProfileUri = useMemo(() => {
        return selectedProfile ? `file://${selectedProfile.path}` : undefined
    }, [selectedProfile]);

    return <Box>
        <HStack space={7} mt='6px'>
        <Center mt='-12px'>
            {
                (selectedProfile || currProfile?.avatar) ?
                <IconImage imageUri={selectedProfile?.sourceURL || constructedProfileUri || currProfile?.avatar?.mainUri || ''} size={72} shadow='9' /> :
                <IconButton label='profile' size={72} shadow='9' />
            }
            <Button colorScheme='coolGray' m='auto' borderRadius='24px' px='12px' variant='solid'
            onPress={() => selectProfileImage(setSelectedProfile, setEdited)} py='6px' opacity='0.7' mt='-40px'>
                <Text fontSize='9px' color='#f5f5f5' fontWeight='medium'>
                    Change profile image
                </Text>
            </Button>
        </Center>
        <VStack flex='1'>
            <Spacer />
            {
                editField({
                    value: newDisplayName,
                    setValue: setNewDisplayName,
                    prompt: 'Edit your display name'
                })
            }
            <Spacer />
        </VStack>
        </HStack>
        {
            edited && !imageUploading &&
            <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' mt='12px' fontWeight='bold' onPress={onSave}>
                <Heading color='white' fontSize='sm'>
                    Save
                </Heading>
            </Button>
        }
        {
            imageUploading &&
            <Spinner type='ThreeBounce' color="black" />
        }
    </Box>;
}
