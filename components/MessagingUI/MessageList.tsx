import React, { useState, useRef, useEffect, useContext } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Box, Center, Pressable, View } from 'native-base';

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, loadAdditionalMessages, loadMessagesToDate, sendNewLike } from "../../redux/slices/chatSlice";
import { Message, UserConversationProfile } from "../../types/types";
import MessageDisplay from "./MessageDisplay";
import SocketContext from "../../contexts/SocketContext";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import useRequest from "../../requests/useRequest";
import Spinner from "react-native-spinkit";

export default function MessageList({
    setReplyMessage,
    selectedMid,
    setSelectedMid,
    profiles
}: {
    setReplyMessage: (message: Message | undefined) => void;
    selectedMid: string | undefined;
    setSelectedMid: (id: string | undefined) => void;
    profiles: {[id: string]: UserConversationProfile};
}): JSX.Element {
    const dispatch = useAppDispatch();
    const listRef = useRef<FlatList | null>(null);
    const { currentConvo, requestLoading, requestCursor } = useAppSelector(chatSelector);
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { conversationsApi } = useRequest();

    const [indexMap, setIndexMap] = useState<{[id: string]: number}>({});
    const [replyFetch, setReplyFetch] = useState<string | undefined>();

    const goToReply = (message: Message) => {
        setSelectedMid(undefined);
        console.log(indexMap);
        if (message.replyRef && listRef.current && (message.replyRef.id in indexMap)) {
            listRef.current.scrollToIndex({
                index: indexMap[message.replyRef.id],
                animated: true
            });
            setSelectedMid(message.replyRef.id);
        } else if (message.replyRef && currentConvo) {
            conversationsApi.getMessage(currentConvo.id, message.replyRef.id).  then((res) => {
                dispatch(loadMessagesToDate(res.timestamp, conversationsApi));
                setReplyFetch(res.id);
                if (listRef.current) listRef.current.scrollToEnd();
            }).catch((err) => {
                console.log(err);
                setReplyFetch(undefined);
            })
        }
    };

    useEffect(() => {
        if (replyFetch && (replyFetch in indexMap) && currentConvo && indexMap[replyFetch] < currentConvo.messages.length) {
            console.log('scrolling to index ' + indexMap[replyFetch].toString());
            listRef.current?.scrollToIndex({
                index: indexMap[replyFetch],
                animated: true
            });
            setSelectedMid(replyFetch);
            setReplyFetch(undefined);
        }
    }, [indexMap, replyFetch, currentConvo, requestLoading]);

    useEffect(() => {
        if (!currentConvo) return;
        const newIndexVals: {[id: string]: number} = Object.fromEntries(
            currentConvo?.messages.map((message: Message, index: number) => {
                return [message.id, index];
            })
        );
        setIndexMap(newIndexVals);
    }, [currentConvo, requestLoading]);

    const renderMessage = ({item, index}: {
        item?: Message,
        index: number
    }) => {
        const message = item;
        if (!message) return null;

        return (
            <Pressable 
            pt={currentConvo && index === currentConvo.messages.length - 1 ? '40px' : '0px'}
            onPress={() => {
                if (selectedMid !== undefined && selectedMid !== message.id) {
                    setSelectedMid(undefined);
                }
            }}>
                <MessageDisplay
                    key={message.id}
                    message={message}
                    participants={profiles}
                    selected={message.id === selectedMid}
                    handleSelect={() => {
                        if (!selectedMid && message.id !== selectedMid) {
                            setSelectedMid(message.id);
                        } else {
                            setSelectedMid(undefined);
                        }
                    }}
                    handleLike={() => user && socket && dispatch(sendNewLike({
                        socket,
                        messageId: message.id,
                        userId: user.id
                    }))}
                    handleReply={() => setReplyMessage(message)} 
                    handleReplySelect={() => {
                        goToReply(message)
                    }}
                />
            </Pressable>
        );
    };

    return <FlatList
        ref={listRef}
        data={currentConvo?.messages}
        renderItem={renderMessage}
        keyExtractor={(item: Message) => item.id}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const {contentOffset} = event.nativeEvent;
            if (contentOffset.y < 20 && requestCursor) {
                dispatch(loadAdditionalMessages(conversationsApi));
            }
        }}
        onScrollToIndexFailed={info => {
            const wait = new Promise(resolve => setTimeout(resolve as any, 500));
            wait.then(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
        }}
        inverted
        ListFooterComponent={(requestCursor || requestLoading) ?
            <View>
                <Center w='100%' mt='40px'>
                    <Spinner type='ChasingDots' color='#111' size={24} />
                </Center>
            </View> : null}
     />
}