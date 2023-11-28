import React, { useContext } from 'react';
import { Box, Text, VStack, HStack, Center, Menu } from 'native-base';
import { MessageMediaBuffer } from '../../types/types';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import UIContext from '../../contexts/UIContext';
import colors from '../colors';

type MenuItem = 'photo' | 'camera' | 'poll' | 'event';

export default function ContentSelectionMenu({
    setMediaBuffer,
    openPollBuilder,
    openEventBuilder,
    closeMenu
}:{
    setMediaBuffer: (buffers: MessageMediaBuffer[] | undefined) => void;
    openPollBuilder : () => void;
    openEventBuilder: () => void;
    closeMenu: () => void;
}): JSX.Element {
    const { theme } = useContext(UIContext);

    const getLibraryImage = () => launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 0,
        videoQuality: 'medium',
        quality: 0.8,
        formatAsMp4: true,
        maxWidth: 500
    });

    const getCameraImage = () => launchCamera({
        mediaType: 'mixed',
        videoQuality: 'medium',
        quality: 0.8,
        formatAsMp4: true,
        maxWidth: 500
    });

    const handleSelectedAssets = async (selectionRes: ImagePickerResponse) => {
        try {
            if (!selectionRes.didCancel && selectionRes.assets && selectionRes.assets.length > 0) {
                const mediaBuffer: MessageMediaBuffer[] = selectionRes.assets.map((asset) => ({
                    id: uuid.v4().toString(),
                    type: asset.type || 'image',
                    fileUri: asset.uri || '',
                    width: asset.width || 0,
                    height: asset.height || 0
                }));
                setMediaBuffer(mediaBuffer.filter(m => m.fileUri && m.width > 0 && m.height > 0));
                closeMenu();
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleImageSelect = async () => {
        try {
            const selectionRes = await getLibraryImage();
            handleSelectedAssets(selectionRes);
        } catch (err) {
            console.log(err);
        }
    };

    const handleCameraSelect = async () => {
        try {
            const selectionRes = await getCameraImage();
            handleSelectedAssets(selectionRes);
        } catch (err) {
            console.log(err);
        }
    };

    const getButtonText = (menuItem: MenuItem) => {
        switch (menuItem) {
            case 'photo':
                return 'Select a photo';
            case 'camera':
                return 'Take a photo';
            case 'poll':
                return 'Create a poll';
            case 'event':
                return 'Create an event';
            default:
                return ''
        }
    }

    const getIcon = (menuItem: MenuItem): JSX.Element => {
        switch (menuItem) {
            case 'photo':
                return <MaterialIcons name="photo-library" size={24} color={colors.textMainNB[theme]} />
            case 'camera':
                return <MaterialIcons name="camera-alt" size={24} color={colors.textMainNB[theme]} />
            case 'event':
                return <MaterialIcons name="event" size={24} color={colors.textMainNB[theme]} />
            case 'poll':
                return <MaterialCommunityIcons name="poll" size={24} color={colors.textMainNB[theme]} />
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
                        <Text fontWeight='medium' color={colors.textMainNB[theme]} >
                            {getButtonText(menuItem)}
                        </Text>
                    </HStack>
                </Center>
            </Box>
        </TouchableOpacity>
    );

    return <Box w='100%' bgColor={theme === 'light' ? 'rgba(250, 250, 250, 0.8)': 'rgba(0, 0, 0, 0.5)'} pb='36px' pt='6px' mb='-48px' mt='-152px'>
        <VStack space={1} pb='12px'>
            <MenuItem menuItem='event' onPress={() => {
                openEventBuilder()
                closeMenu()
            }} />
            <MenuItem menuItem='poll' onPress={() => {
                openPollBuilder()
                closeMenu()
            }} />
            <MenuItem menuItem='camera' onPress={handleCameraSelect} />
            <MenuItem menuItem='photo' onPress={handleImageSelect} />
        </VStack>
    </Box>
}