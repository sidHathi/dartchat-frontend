import React from "react";
import { Box } from 'native-base';
import FastImage from "react-native-fast-image";
import { MessageMedia } from "../../types/types";
import Video from 'react-native-fast-video';

export default function GalleryImage({
    media,
    width,
    height
}: {
    media: MessageMedia
    width: number,
    height: number
}): JSX.Element {
    return <Box p='0' borderRadius='12px' shadow='9' style={{
        shadowOpacity: 0.18
    }}>
        {
        media.type.includes('image') ?
        <FastImage source={{
            uri: media.uri,
            priority: FastImage.priority.normal
        }} style={{
            width,
            height,
            borderRadius: 12
        }} /> :
        media.type.includes('video') ?
        <Video
            controls={true}
            repeat={true}
            source={{
                uri: media.uri,
            }}
            style={{
                width,
                height,
                borderRadius: 12,
            }} /> 
        : <></>
        }
    </Box>;
}
