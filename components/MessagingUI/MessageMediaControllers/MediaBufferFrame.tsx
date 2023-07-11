import React from "react";
import { Box, HStack, Progress, Spacer } from 'native-base'
import FastImage from "react-native-fast-image";
import { MessageMediaBuffer } from "../../../types/types";
import IconButton from "../../generics/IconButton";
import Video from 'react-native-fast-video';

export default function MediaBufferFrame({
    media,
    onDelete,
    maxHeight,
    uploadProgress
}: {
    media: MessageMediaBuffer,
    onDelete: () => void,
    maxHeight?: number,
    uploadProgress?: number
}): JSX.Element {

    const aspect = media.height / media.width;

    const displayHeight = Math.min(maxHeight || Number.MAX_VALUE, media.height);
    const displayWidth = displayHeight / aspect;

    return <Box w={`${displayWidth}px`} h={`${displayHeight}px`} borderRadius='12px' shadow='9' style={{shadowOpacity: 0.07}} bgColor='coolGray.800'>
        <HStack w='100%' px='12px' zIndex={3} mt='12px'>
            <Spacer />
            <IconButton label='cancel' shadow='none' size={24} onPress={onDelete}/>
        </HStack>
        {
            media.fileUri && aspect > 0 && 
            (
                media.type.includes('image') ?
                <FastImage source={{
                    uri: media.fileUri,
                    priority: FastImage.priority.normal
                }} style={{
                    width: displayWidth,
                    height: displayHeight,
                    borderRadius: 12,
                    marginTop: -36,
                }} 
                resizeMode={FastImage.resizeMode.cover}
                /> : 
                
                media.type.includes('video') ?
                <Video source={{
                    uri: media.fileUri,
                }}
                style={{
                    width: displayWidth,
                    height: displayHeight,
                    borderRadius: 12,
                    marginTop: -36,
                }} /> 
                : <></>
            )
        }
        {uploadProgress &&
        <Progress value={uploadProgress * 100} colorScheme='dark' mt='-24px' w='90%' mx='auto'/>
        }
    </Box>
}
