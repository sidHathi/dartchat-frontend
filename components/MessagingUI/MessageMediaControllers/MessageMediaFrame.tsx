import React from "react";
import { Box, Pressable, Progress, Spacer } from 'native-base'
import FastImage from "react-native-fast-image";
import { MessageMedia } from "../../../types/types";
import Video from 'react-native-fast-video';
import { Dimensions } from "react-native";

export default function MessageMediaFrame({
    media,
    handleSelect,
    maxHeight,
}: {
    media: MessageMedia,
    handleSelect: () => void,
    maxHeight?: number,
}): JSX.Element {

    const aspect = media.height / media.width;

    let displayHeight = Math.min(maxHeight || Number.MAX_VALUE, media.height);
    let displayWidth = displayHeight / aspect;
    const screenWidth = Dimensions.get('window').width;
    const maxWidth = screenWidth - 80;
    if (displayWidth > maxWidth) {
        displayWidth = maxWidth;
        displayHeight = aspect * displayWidth;
    }

    return (
    <Pressable onPress={() => {
        if (media.type.includes('image')) {
            console.log('media selected');
            handleSelect();
        }
    }}>
        <Box w={`${displayWidth}px`} h={`${displayHeight}px`} borderRadius='12px' shadow='9' bgColor='coolGray.800' overflow='visible'>
            {
                media.uri && aspect > 0 && 
                (
                    media.type.includes('image') ?
                    <FastImage source={{
                        uri: media.uri,
                        priority: FastImage.priority.normal
                    }} style={{
                        width: displayWidth,
                        height: displayHeight,
                        borderRadius: 12,
                    }} 
                    resizeMode={FastImage.resizeMode.cover}
                    /> : 
                    
                    media.type.includes('video') ?
                    <Video
                        controls={true}
                        repeat={true}
                        source={{
                            uri: media.uri,
                        }}
                        style={{
                            width: displayWidth,
                            height: displayHeight,
                            borderRadius: 12,
                        }} /> 
                    : <></>
                )
            }
        </Box>
    </Pressable>
    );
}
