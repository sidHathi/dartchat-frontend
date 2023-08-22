import React, { useState, useRef, useEffect, useContext } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Box, Center, Pressable, View, Text } from 'native-base';

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, loadAdditionalMessages, loadMessagesToDate, sendNewLike } from "../../redux/slices/chatSlice";
import { DecryptedMessage, Message, UserConversationProfile } from "../../types/types";
import MessageDisplay from "./MessageDisplay";
import SocketContext from "../../contexts/SocketContext";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import useRequest from "../../requests/useRequest";
import Spinner from "react-native-spinkit";
import { getDateTimeString } from "../../utils/messagingUtils";

export default function MessageList({
    setReplyMessage,
    selectedMid,
    setSelectedMid,
    profiles,
    closeContentMenu,
    handleMediaSelect,
    handleProfileSelect,
    handleMessageDelete,
}: {
    setReplyMessage: (message: DecryptedMessage | undefined) => void;
    selectedMid: string | undefined;
    setSelectedMid: (id: string | undefined) => void;
    profiles: {[id: string]: UserConversationProfile};
    closeContentMenu: () => void;
    handleMediaSelect: (message: DecryptedMessage, index: number) => void;
    handleProfileSelect: (profile: UserConversationProfile) => void;
    handleMessageDelete: (mid: string) => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const listRef = useRef<FlatList | null>(null);
    const { currentConvo, requestLoading, messageCursor } = useAppSelector(chatSelector);
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { conversationsApi } = useRequest();

    const [indexMap, setIndexMap] = useState<{[id: string]: number}>({});
    const [replyFetch, setReplyFetch] = useState<string | undefined>();

    const goToReply = (message: Message) => {
        setSelectedMid(undefined);
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

    const goToLink = (message: Message) => {
        setSelectedMid(undefined);
        if (message.messageLink && listRef.current && (message.messageLink in indexMap)) {
            listRef.current.scrollToIndex({
                index: indexMap[message.messageLink],
                animated: true
            });
            setSelectedMid(message.messageLink);
        } else if (message.messageLink && currentConvo) {
            conversationsApi.getMessage(currentConvo.id, message.messageLink)
                .then((res) => {
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
        item?: DecryptedMessage,
        index: number
    }) => {
        const message = item;
        if (!message) return null;

        let timeDif = 0;
        if (currentConvo && index > 0) {
            timeDif = (message.timestamp.getTime() - currentConvo.messages[index - 1].timestamp.getTime()) / 60000; // timeDif in minutes
        }

        return (
            <>
            {timeDif < -10 &&
            <Center mt='12px' mb='6px'>
                <Text fontSize='xs' color='gray.500' textAlign='center'>
                    { getDateTimeString(message.timestamp) }
                </Text>
            </Center>
            }
            <Pressable 
            pt={currentConvo && index === currentConvo.messages.length - 1 ? '40px' : '0px'}
            onPress={() => {
                if (selectedMid !== undefined && selectedMid !== message.id) {
                    setSelectedMid(undefined);
                }
                closeContentMenu();
            }}>
                <MessageDisplay
                    key={message.id}
                    message={message as DecryptedMessage}
                    participants={profiles}
                    selected={message.id === selectedMid}
                    handleSelect={() => {
                        if (message.messageLink) {
                            goToLink(message);
                        } else if (!selectedMid && message.id !== selectedMid) {
                            setSelectedMid(message.id);
                        } else {
                            setSelectedMid(undefined);
                        }
                        closeContentMenu();
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
                    handleMediaSelect={handleMediaSelect}
                    handleProfileSelect={handleProfileSelect}
                    handleDelete={() => handleMessageDelete(message.id)}
                />
            </Pressable>
            </>
        );
    };

    return <FlatList
        ref={listRef}
        data={currentConvo?.messages || []}
        renderItem={renderMessage}
        keyExtractor={(item: DecryptedMessage) => item.id}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const {contentOffset, contentSize} = event.nativeEvent;
            if (contentOffset.y > contentSize.height - 800 && messageCursor) {
                // console.log('fetching messages');
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
        ListFooterComponent={(messageCursor || requestLoading) ?
            <View>
                <Center w='100%' mt='40px'>
                    <Spinner type='ChasingDots' color='#111' size={24} />
                </Center>
            </View> : null}
        ListHeaderComponent={<Box w='100%' h='84px'></Box>}
        horizontal={false}
     />
}