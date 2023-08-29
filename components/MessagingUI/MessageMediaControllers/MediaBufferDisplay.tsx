import React from "react";
import { MessageMediaBuffer } from "../../../types/types";
import { HStack, ScrollView } from "native-base";
import MediaBufferFrame from "./MediaBufferFrame";

export default function MediaBufferDisplay({
    mediaBuffer,
    setMediaBuffer,
    progressMap
} : {
    mediaBuffer?: MessageMediaBuffer[]
    setMediaBuffer: (newBuffer: MessageMediaBuffer[] | undefined) => void;
    progressMap?: {[id:string]: number}
}): JSX.Element {
    const displayHeight = 200;

    const handleMediaDelete = (media: MessageMediaBuffer) => {
        if (!mediaBuffer) return;
        const newMediaBuffer = mediaBuffer.filter(m => media.id !== m.id);
        if (newMediaBuffer.length === 0) {
            setMediaBuffer(undefined);
        } else {
            setMediaBuffer(newMediaBuffer);
        }
    };
    
    return <ScrollView horizontal h={`${displayHeight}px`} w='100%' mb='12px'>
        <HStack space={2}>
            {
                mediaBuffer && mediaBuffer.filter(media => media.width > 0 && media.height > 0).map((media) => (
                    <MediaBufferFrame key={media.id} media={media} maxHeight={displayHeight} onDelete={() => handleMediaDelete(media)} uploadProgress={
                        (progressMap && media.id in progressMap) ? progressMap[media.id] : undefined
                    }/>
                ))
            }
        </HStack>
    </ScrollView>
}
