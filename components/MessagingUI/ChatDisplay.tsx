import React, { useState, useContext, useEffect, useRef } from 'react';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Conversation, Message, UserConversationProfile } from '../../types/types';
import {Box, VStack, HStack, Spacer, Heading, Pressable} from 'native-base';
import { View, ScrollView } from 'react-native';
import MessageEntry from './MessageEntry';
import IconButton from '../generics/IconButton';
import { Dimensions, LayoutChangeEvent } from 'react-native';
import { logOut } from '../../firebase/auth';
import ConversationContext from '../../contexts/CurrentConversationContext';
import MessageDisplay from './MessageDisplay';
import ReplyMessageDisplay from './ReplyMessageDisplay';

export default function ChatDisplay({exit}: {
    exit: () => void
}): JSX.Element {
    const chatScroll = useRef<ScrollView | null>(null); 
    const screenHeight = Dimensions.get('window').height;

    const { user } = useContext(AuthIdentityContext);
    const { currentConvo, sendNewLike } = useContext(ConversationContext);
    const [profiles, setProfiles] = useState<{[id: string]: UserConversationProfile}>({});
    const [selectedMiD, setSelectedMiD] = useState<string | undefined>(undefined);
    const [replyMessage, setReplyMessage] = useState<Message | undefined>(undefined);
    const [messageEntryHeight, setMessageEntryHeight] = useState(90);
    const [heightDif, setHeightDif] = useState(0);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [messageLocMap, setMessageLocMap] = useState<{
        [id: string]: number
    }>({});
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        const asyncInit = async () => {
            await new Promise((r) => setTimeout(r as any, 1000));
            setInitialized(true);
        }
        if (initialized) return;
        if (chatScroll.current && !initialized) chatScroll.current.scrollToEnd();
        asyncInit();
    }, [messageLocMap]);

    useEffect(() => {
        if (!currentConvo) return;
        setProfiles(Object.fromEntries(
            currentConvo.participants.map(p => [p.id, p])
        ));
    }, [currentConvo]);

    const modifyMessageLocMap = (id: string, yLoc: number) => {
        setMessageLocMap({
            ...messageLocMap,
            [id]: yLoc
        })
    };

    const goToReply = (message: Message) => {
        setSelectedMiD(undefined);
        if (message.replyRef && chatScroll.current && (message.id in messageLocMap)) {
            chatScroll.current.scrollTo({x: 0, y: messageLocMap[message.replyRef.id] - (screenHeight/3), animated: true});
            setSelectedMiD(message.replyRef.id);
        }
    }

    return <Box w='100%' h={screenHeight} backgroundColor='#222'>
    <Box backgroundColor='#fefefe' h='90px' overflow='hidden' zIndex='1001'>
        <Box backgroundColor='#222' borderBottomRightRadius='24px' h='90px' zIndex='999'>
            <HStack paddingTop='50px' marginX='6px'>
                <IconButton label='back' size={24} additionalProps={{marginX: '4px', mt: '5px'}} onPress={exit}/>
                <Heading fontSize='md' color='white' paddingTop='8px'>
                    {currentConvo?.name || 'Chat'}
                </Heading>
                <Spacer />
                <IconButton label='settings' size={24} additionalProps={{marginX: '6px', mt: '5px'}}/>
                <IconButton label='profile' size={33} additionalProps={{marginX: '6px'}} onPress={logOut}/>
            </HStack>
        </Box>
    </Box>
    <Box w='100%' h={`${screenHeight - 90} px`} backgroundColor='#fefefe' borderTopLeftRadius='24px' shadow='9' zIndex='1000'>
            <VStack w='100%' h='100%' space={1}>
                <View  
                    style={{
                        height: screenHeight - 90 - messageEntryHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'transparent',
                    }}>
                <ScrollView
                    ref={chatScroll}
                    style={{
                        flexGrow: 0,
                        display: 'flex',
                        marginTop: 'auto',
                        marginBottom: 0,
                        backgroundColor: 'transparent',
                    }}
                    onContentSizeChange={() => {
                        if (shouldScroll) {
                            chatScroll.current && chatScroll.current.scrollToEnd()
                            setShouldScroll(false);
                        }
                        setInitialized(true);
                    }}
                    onScroll={() => {setInitialized(true)}}
                    onTouchStart={() => {setInitialized(true)}}
                    onScrollBeginDrag={() => {setInitialized(true)}}
                    onLayout={() => setInitialized(true)}>
                {/* <VStack w='100%' minHeight={`${screenHeight - 90 - messageEntryHeight} px`} space={2} overflowY='scroll'> */}
                    {
                        currentConvo && currentConvo.messages.map(
                            (message, idx) => {
                                return <View onLayout={
                                    (event: LayoutChangeEvent) => {
                                        const {y} = event.nativeEvent.layout;
                                        modifyMessageLocMap(message.id, y);
                                    }
                                }
                                style={idx === 0 && {marginTop: 60}}
                                key={message.id}>
                                <Pressable onPress={() => {
                                    if (selectedMiD !== undefined && selectedMiD !== message.id) {
                                        setSelectedMiD(undefined);
                                    }
                                    setInitialized(true);
                                }}>
                                        <MessageDisplay
                                            key={message.id}
                                            message={message}
                                            participants={profiles}
                                            selected={message.id === selectedMiD}
                                            handleSelect={() => {
                                                if (!selectedMiD && message.id !== selectedMiD) {
                                                    setSelectedMiD(message.id);
                                                } else {
                                                    setSelectedMiD(undefined);
                                                }
                                            }}
                                            handleLike={() => user && sendNewLike(
                                                message.id,
                                                user.id
                                            )}
                                            handleReply={() => setReplyMessage(message)} 
                                            handleReplySelect={() => {
                                                goToReply(message)
                                            }}
                                        />
                                    </Pressable>
                                </View>
                            }
                        )
                    }
                    {/* </VStack> */}
                </ScrollView>
                </View>
                <Spacer />
                <View onLayout={(event: LayoutChangeEvent) => {
                        const {height} = event.nativeEvent.layout;
                        setMessageEntryHeight(height);
                    }}
                    style={{display: 'flex', flexDirection: 'column'}}>
                    <VStack w='100%' mt='auto'>
                        {
                            replyMessage &&
                            <ReplyMessageDisplay 
                                participants={profiles}
                                message={replyMessage}
                                handleDeselect={() => setReplyMessage(undefined)}
                            />
                        }
                        <Box mt={`${heightDif} px`}>
                        <MessageEntry 
                            replyMessage={replyMessage} 
                            onSend={() => {
                                setReplyMessage(undefined);
                                setSelectedMiD(undefined);
                                setShouldScroll(true);
                                setInitialized(true);
                            }} />
                        </Box>
                    </VStack>
                </View>
            </VStack>
=        </Box>
    </Box>
}