import React, {useEffect, useRef} from "react";
import { MessageMedia } from "../../../types/types";
import { HStack, Pressable } from "native-base";
import MessageMediaFrame from "./MessageMediaFrame";
import { Dimensions } from 'react-native';
import { ScrollView, View } from "react-native";

export default function MessageMediaDisplay({
    media,
    handleMediaSelect
} : {
    media: MessageMedia[];
    handleMediaSelect?: (index: number) => void;
}): JSX.Element {
    const scrollRef = useRef<ScrollView | null>(null);
    const displayHeight = 300;
    const screenWidth = Dimensions.get('window').width;
    const mediaWidth: number = media.reduce((acc, curr) => {
        const aspect = curr.height / curr.width;
        const displayWidth = Math.min(displayHeight / aspect, screenWidth - 80);
        return acc + displayWidth + 10;
    }, 0);

    useEffect(() => {
        // console.log(media.length);
        // console.log(mediaWidth);
    }, []);
    
    return <View
    onStartShouldSetResponder={() => true}>
        <ScrollView 
        onStartShouldSetResponder={() => true}
        nestedScrollEnabled
        horizontal={true}
        style={{
            marginTop: 18,
            width: Math.min(screenWidth, mediaWidth),
            overflow: 'visible', 
            marginLeft: Math.min(Math.max(-18, 225 - mediaWidth), 0)
        }}
        ref={scrollRef}
        showsHorizontalScrollIndicator={true}
        scrollEnabled={mediaWidth > screenWidth - 80}
        pagingEnabled={false}>
        <Pressable>
            <HStack space={2} overflow='visible' mr='100px'>
                {
                    media.filter(m => m.width > 0 && m.height > 0).map((m, index) => (
                        <MessageMediaFrame key={m.id} media={m} maxHeight={displayHeight} handleSelect={() => {
                            handleMediaSelect && handleMediaSelect(index);
                        }}/>
                    ))
                }
            </HStack>
        </Pressable>
    </ScrollView>
    </View>
}
