import React, { useContext, useMemo } from "react";
import ImageView from 'react-native-image-viewing';
import { MessageMedia, Message } from "../../../types/types";
import { Box, HStack, Spacer } from 'native-base';
import IconButton from "../../generics/IconButton";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { chatSelector, sendNewLike } from "../../../redux/slices/chatSlice";
import SocketContext from "../../../contexts/SocketContext";
import AuthIdentityContext from "../../../contexts/AuthIdentityContext";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

export default function FullScreenMediaFrame({
    message,
    setMessage,
    handleReply,
    startIndex,
}: {
    message: Message | undefined,
    setMessage: (message: Message | undefined) => void;
    handleReply?: () => void;
    startIndex?: number;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);

    const handleLike = () => {
        if (!socket || !user || !message) return;
        dispatch(sendNewLike({
            socket,
            messageId: message.id,
            userId: user.id
        }));
    };
    
    const reduxMessage = useMemo(() => {
        if (!currentConvo) return undefined;
        const matches = currentConvo.messages.filter((m) => (
            m.id === message?.id
        ));
        return matches.length > 0 ? matches[0] : undefined;
    }, [currentConvo]);

    const downloadImage = () => {
        if (!message || !message.media) return;
        return message.media.map(media => CameraRoll.save(media.uri));
    };

    const Footer = (): JSX.Element => <Box>
        <HStack w='100%' space={5} px='24px' mb='48px'>
            <IconButton label='download' color='white' shadow='none' size={24} onPress={downloadImage}/> 
            <Spacer />
            {
                reduxMessage && reduxMessage.likes.length > 0 ?
                <IconButton label='heartFill' color='white' shadow='none' size={24} onPress={handleLike}/> :
                <IconButton label='heartEmpty' color='white' shadow='none' size={24} onPress={handleLike}/> 
            }
            {
                handleReply &&
                <IconButton label='reply' color='white' shadow='none' size={24} onPress={handleReply}/> 
            }
        </HStack>
    </Box>

    if (message && message.media) {
        return  (
            <ImageView
                images={message.media.map((m) => ({ uri: m.uri }))}
                imageIndex={startIndex ? startIndex : 0}
                visible={message !== undefined && message.media !== undefined}
                onRequestClose={() => setMessage(undefined)}
                FooterComponent={Footer}
            />
        );
    } else {
        return <></>
    }
}
