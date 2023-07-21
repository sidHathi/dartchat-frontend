import React from 'react';
import { Box, Text, VStack, HStack, Center, Menu } from 'native-base';
import { MessageMediaBuffer } from '../../types/types';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';

type MenuItem = 'photo' | 'camera' | 'poll';

export default function ContentSelectionMenu({
    setMediaBuffer,
    openPollBuilder,
    closeMenu
}:{
    setMediaBuffer: (buffers: MessageMediaBuffer[] | undefined) => void;
    openPollBuilder : () => void;
    closeMenu: () => void;
}): JSX.Element {

    const handleImageSelect = async () => {
        try {
            const selectionRes = await launchImageLibrary({
                mediaType: 'mixed',
                selectionLimit: 0,
                videoQuality: 'medium',
                quality: 0.8,
                formatAsMp4: true,
                maxWidth: 500
            });
            if (!selectionRes.didCancel && selectionRes.assets && selectionRes.assets.length > 0) {
                const mediaBuffer: MessageMediaBuffer[] = selectionRes.assets.map((asset) => ({
                    id: uuid.v4().toString(),
                    type: asset.type || 'image',
                    fileUri: asset.uri || '',
                    width: asset.width || 0,
                    height: asset.height || 0
                }));
                console.log(mediaBuffer);
                setMediaBuffer(mediaBuffer.filter(m => m.fileUri && m.width > 0 && m.height > 0));
                closeMenu();
            }
        } catch (err) {
            console.log(err);
        }
    }

    const getButtonText = (menuItem: MenuItem) => {
        switch (menuItem) {
            case 'photo':
                return 'Select a photo';
            case 'camera':
                return 'Take a photo';
            case 'poll':
                return 'Create a poll';
            default:
                return ''
        }
    }

    const getIcon = (menuItem: MenuItem): JSX.Element => {
        switch (menuItem) {
            case 'photo':
                return <MaterialIcons name="photo-library" size={24} color="black" />
            case 'camera':
                return <MaterialIcons name="camera-alt" size={24} color="black" />
            case 'poll':
                return <MaterialCommunityIcons name="poll" size={24} color="black" />
            default:
                return <></>
        }
    }

    const MenuItem = ({
        menuItem,
        onPress
    }: {
        menuItem: MenuItem,
        onPress: () => void
    }): JSX.Element => (
        <TouchableOpacity style={{width: '100%'}} activeOpacity={0.5} onPress={onPress}>
            <Box borderRadius='12px' w='96%' mx='auto' p='12px'>
                <Center width='100%'>
                    <HStack w='100%' space={3}>
                        {getIcon(menuItem)}
                        <Text fontWeight='medium' color='black'>
                            {getButtonText(menuItem)}
                        </Text>
                    </HStack>
                </Center>
            </Box>
        </TouchableOpacity>
    );

    return <Box w='100%' bgColor='rgba(250, 250, 250, 0.8)' pb='36px' pt='6px' mb='-48px' mt='-152px'>
        <VStack space={1} pb='12px'>
            <MenuItem menuItem='poll' onPress={() => {
                openPollBuilder()
                closeMenu()
            }} />
            <MenuItem menuItem='camera' onPress={() => {return;}} />
            <MenuItem menuItem='photo' onPress={handleImageSelect} />
        </VStack>
    </Box>
}