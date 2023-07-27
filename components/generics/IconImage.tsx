import React from "react";
// import { Image } from 'react-native';
import FastImage from "react-native-fast-image";
import { Box } from "native-base";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function IconImage({
    imageUri,
    size,
    shadow,
    onPress,
    nbProps
}: {
    imageUri: string,
    size: number,
    shadow?: string,
    onPress?: () => void
    nbProps?: any
}): JSX.Element {
    return (
        onPress ?
            <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
                <Box w={`${size}px`} h={`${size}px`} borderRadius={size} shadow={shadow} {...nbProps}>
                    <FastImage source={{
                        uri: imageUri,
                        priority: FastImage.priority.high
                    }} style={{
                        width: size,
                        height: size,
                        borderRadius: size
                    }}
                    resizeMode={FastImage.resizeMode.cover} />
                </Box>
            </TouchableOpacity> :

            <Box w={`${size}px`} h={`${size}px`} borderRadius={size} shadow={shadow} {...nbProps}>
                <FastImage source={{
                    uri: imageUri,
                    priority: FastImage.priority.high
                }} style={{
                    width: size,
                    height: size,
                    borderRadius: size
                }}
                resizeMode={FastImage.resizeMode.cover} />
            </Box>
    );
}
