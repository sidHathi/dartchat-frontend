import React, { useState, useContext, useMemo } from 'react';

import { View, Box, VStack, Button, Input, Heading, Text, Center, FormControl} from 'native-base';
import DartChatLogoDarkXML from '../../assets/DartChatLogoDarkXML';
import { SvgXml } from "react-native-svg";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { AxiosError } from 'axios';
import { Image } from 'react-native-image-crop-picker';
import { selectProfileImage } from '../../utils/identityUtils';
import IconButton from '../generics/IconButton';
import IconImage from '../generics/IconImage';
import { getDownloadUrl, storeProfileImage } from '../../firebase/cloudStore';
import { AvatarImage } from '../../types/types';
import Spinner from 'react-native-spinkit';
import { useKeyboard } from "@react-native-community/hooks";

export default function IdentitySetup(): JSX.Element {
    const { isAuthenticated, user, createUser, logOut } = useContext(AuthIdentityContext);

    const [handle, setHandle] = useState<string | undefined>(undefined);
    const [displayName, setDisplayName] = useState<string | undefined>(undefined);
    const [phone, setPhone] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);
    const [imageUploading, setImageUploading] = useState<boolean>(false);
    const [selectedAvatarImage, setSelectedAvatarImage] = useState<Image | undefined>();
    const { keyboardShown } = useKeyboard();

    const getUserAvatarFromImage = async () => {
        if (!selectedAvatarImage || !user) return undefined;
        setImageUploading(true);
        try {
            const {
                mainTask,
                tinyTask,
                mainLoc,
                tinyLoc
            } = await storeProfileImage(user, selectedAvatarImage.path, selectedAvatarImage.sourceURL);
            await mainTask;
            await tinyTask;
            const mainUri = await getDownloadUrl(mainLoc);
            const tinyUri = await getDownloadUrl(tinyLoc);
            const avatar: AvatarImage = {
                mainUri,
                tinyUri
            };
            setImageUploading(false);
            return avatar;
        } catch (err) {
            console.log(err);
            setImageUploading(false);
            setError('Image upload failed');
        }
    }

    const handleSubmit = async () => {
        // console.log('submitting');
        if (!isAuthenticated || !user) return;
        createUser({
            ...user,
            handle,
            displayName,
            phone,
            avatar: await getUserAvatarFromImage()
        })
        .catch((err: AxiosError) => {
            if (err.isAxiosError && err.response?.status === 409) {
                setError(JSON.stringify(err.response.data) || 'Server error');
            } else {
                setError(err.message);
            }
        });
    };

    const constructedProfileUri = useMemo(() => {
        return selectedAvatarImage ? `file://${selectedAvatarImage.path}` : undefined
    }, [selectedAvatarImage]);

    const ProfileSelector = () => (
        <Center w='100%' mb='30px' h='90px' mt='-30px'>
                {
                    (selectedAvatarImage && selectedAvatarImage.sourceURL) ?
                    <IconImage imageUri={selectedAvatarImage?.sourceURL || constructedProfileUri || ''} size={100} shadow='9' /> :
                    <IconButton label='profile' size={100} />
                }
                <Button colorScheme='coolGray' m='auto' borderRadius='24px' px='12px' variant='solid'
                onPress={() => selectProfileImage(setSelectedAvatarImage)} py='6px' opacity='0.7' mt='-60px'>
                    <Text fontSize='9px' color='#f5f5f5' fontWeight='medium'>
                        Select profile image
                    </Text>
                </Button>
        </Center>
    );

    return <View w='100%' h='100%' backgroundColor='#fefefe'>
        <Center w='100%' h='100%'>
            <Box w='90%' p='20px' bgColor='gray.100' shadow='9' borderRadius='24px' mt={keyboardShown ? '-200px': '0px'}>
                <Center w='100%'>
                    <SvgXml xml={DartChatLogoDarkXML} height='20' width='120'/>
                </Center>

                <Heading size='md' my='12px'>
                    Setup
                </Heading>

                <ProfileSelector />

                <FormControl>
                <VStack space={1}>
                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                        Choose a unique identification handle
                        <Text fontWeight='bold'> *</Text>
                    </Text>
                    <Input
                        placeholder='Eg. johnDoe123'
                        value={handle}
                        onChangeText={setHandle}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        isRequired
                        variant="underlined"
                        autoCapitalize='none'
                    />
                    </Box>

                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                       {'Name (optional)'}
                    </Text>
                    <Input
                        placeholder='First Last'
                        value={displayName}
                        onChangeText={setDisplayName}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        variant="underlined"
                    />
                    </Box>

                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                       {'Phone Number (optional)'}
                    </Text>
                    <Input
                        placeholder='+123456789'
                        value={phone}
                        onChangeText={setPhone}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        variant="underlined"
                    />
                    </Box>
                </VStack>
                {imageUploading &&
                <Center w='100%'>
                    <Spinner type='ThreeBounce' color='black' />
                </Center>
                }
                </FormControl>
                <Button w='100%' colorScheme='dark' borderRadius='30px' onPress={handleSubmit} variant='subtle' color='white' mt='12px' disabled={!handle}
                opacity={(!handle) ? 0.5 : 1}>
                    Continue
                </Button>
                <Button w='100%' colorScheme='light' borderRadius='30px' onPress={() => logOut()} variant='subtle' color='white' mt='6px' mb='12px'>
                    Cancel
                </Button>
                {error &&
                <Center w='100%'>
                    <Text fontSize='xs' color='red.500'>
                        {error}
                    </Text>
                </Center>
                }
            </Box>
        </Center>
    </View>
}