import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { FlatList, HStack, Box, View, Heading, Spacer, Center } from 'native-base';
import { chatSelector, pullGallery } from '../../redux/slices/chatSlice';
import useRequest from '../../requests/useRequest';
import { Dimensions, NativeSyntheticEvent } from 'react-native';
import { Message, MessageMedia } from '../../types/types';
import GalleryImage from './GalleryImage';
import Spinner from 'react-native-spinkit';
import { NativeScrollEvent } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import FullScreenMediaFrame from '../MessagingUI/MessageMediaControllers/FullScreenMediaFrame';
import { TouchableOpacity } from 'react-native-gesture-handler';

const imagesPerRow = 3;

type MediaRef = {
    mid: string;
    media: MessageMedia;
    idx: number;
};

export default function MediaGallery(): JSX.Element {
    const screenWidth = Dimensions.get('window').width;

    const dispatch = useAppDispatch();
    const { currentConvo, galleryMessages, galleryCursor, requestLoading } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();

    const [selectedMessage, setSelectedMessage] = useState<Message | undefined>();
    const [selectedMessageStartIndex, setSelectedMessageStartIndex] = useState<number>(0);

    useEffect(() => {
        if (currentConvo && !galleryMessages) {
            dispatch(pullGallery(conversationsApi));
        }
    }, [currentConvo]);

    const handleMessageSelect = useCallback((mid: string, idx?: number) => {
        if (!galleryMessages) return;

        const match = galleryMessages.find((message) => message.id === mid);
        if (match) {
            if (idx) {
                setSelectedMessageStartIndex(idx);
            }
            setSelectedMessage(match);
            return;
        }
        setSelectedMessage(undefined);
    }, [galleryMessages]);

    const pullAdditionalImages = useCallback(() => {
        if (!requestLoading && galleryCursor && currentConvo) {
            dispatch(pullGallery(conversationsApi));
        }
    }, [galleryMessages, galleryCursor, requestLoading, currentConvo]);

    const rows = useMemo(() => {
        if (!galleryMessages) return [];
        const rowArr: MediaRef[][] = [];
        let buffer: MediaRef[] = [];
        let addedMessages = 0;
        galleryMessages.map((message) => {
            if (message.media) {
                message.media.map((media, idx) => {
                    buffer.push({
                        mid: message.id,
                        media,
                        idx
                    });
                    addedMessages ++;
                    if (addedMessages % imagesPerRow === 0) {
                        rowArr.push([...buffer]);
                        buffer = [];
                    } 
                })
            }
        });
        if (buffer.length > 0) {
            rowArr.push(buffer);
        }
        return rowArr;
    }, [galleryMessages]);

    const renderRow = ({item: row, index}: {item?: MediaRef[], index: number}) => {
        const padding = 6;
        const whitespace = padding * (2*imagesPerRow + 1);
        const imageWidth = (screenWidth - whitespace)/imagesPerRow;
        console.log(row);
        if (!row) return null;
        return <HStack px={`${padding}px`} pt={`${padding}px`}>
            {
                row.map((ref, idx) => {
                    return <TouchableOpacity onPress={() => handleMessageSelect(ref.mid, ref.idx)}>
                        <Box px={`${padding}px`} key={index * imagesPerRow + idx}>
                            <GalleryImage 
                                media={ref.media}
                                width={imageWidth} 
                                height={imageWidth} />
                        </Box>
                    </TouchableOpacity>
                })
            }
            <Spacer />
        </HStack>
    }

    return <View flex='1' w='100%' h='100%'>
        <Heading px='24px' pt='24px'>
            Gallery
        </Heading>

        <FlatList 
            flex='1'
            w='100%'
            h='100%'
            data={rows}
            renderItem={renderRow}
            keyExtractor={(_, index) => index.toString()}
            onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const {contentOffset, contentSize} = event.nativeEvent;
                if (contentOffset.y > contentSize.height - 800 && galleryCursor) {
                    pullAdditionalImages();
                }
            }}
            ListFooterComponent={(galleryCursor || requestLoading) ?
                <View>
                    <Center w='100%' mt='40px'>
                        <Spinner type='ChasingDots' color='#111' size={24} />
                    </Center>
                </View> : null}
            ListHeaderComponent={<Box h='12px' />}
            />

            <FullScreenMediaFrame
                message={selectedMessage}
                setMessage={setSelectedMessage}
                startIndex={selectedMessageStartIndex}
                />
    </View>;
}