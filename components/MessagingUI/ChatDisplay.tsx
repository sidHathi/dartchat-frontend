import React, { useState, useContext, useEffect, useCallback } from 'react';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Conversation, Message, MessageMedia, MessageMediaBuffer, UserConversationProfile } from '../../types/types';
import {Box, VStack, HStack, Spacer, Heading, Pressable, Center} from 'native-base';
import { View, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import MessageEntry from './MessageEntry';
import IconButton from '../generics/IconButton';
import { Dimensions, LayoutChangeEvent } from 'react-native';
import { logOut } from '../../firebase/auth';
import MessageDisplay from './MessageDisplay';
import ReplyMessageDisplay from './ReplyMessageDisplay';
import ConversationsContext from '../../contexts/ConversationsContext';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { userConversationsSelector } from '../../redux/slices/userConversationsSlice';
import { chatSelector, loadAdditionalMessages, sendNewLike, setNeedsScroll } from '../../redux/slices/chatSlice';
import SocketContext from '../../contexts/SocketContext';
import Spinner from 'react-native-spinkit';
import useRequest from '../../requests/useRequest';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import NetworkContext from '../../contexts/NetworkContext';
import NetworkDisconnectionAlert from '../generics/alerts/NetworkDisconnectionAlert';
import ContentSelectionMenu from './ContentSelectionMenu';
import FullScreenMediaFrame from './MessageMediaControllers/FullScreenMediaFrame';
import ConversationProfileManager from '../IdentityManagement/ConversationProfileManager';

export default function ChatDisplay({exit}: {
    exit: () => void
}): JSX.Element {
    const screenHeight = Dimensions.get('window').height;

    const { currentConvo } = useAppSelector(chatSelector);
    const { networkConnected } = useContext(NetworkContext);
    const { disconnected: socketDisconnected } = useContext(SocketContext);

    const [selectedMid, setSelectedMid] = useState<string | undefined>(undefined);
    const [replyMessage, setReplyMessage] = useState<Message | undefined>(undefined);
    const [messageEntryHeight, setMessageEntryHeight] = useState(90);
    const [profiles, setProfiles] = useState<{[id: string]: UserConversationProfile}>({});
    const [contentMenuOpen, setContentMenuOpen] = useState(false);
    const [selectedMediaBuffer, setSelectedMediaBuffer] = useState<MessageMediaBuffer[] | undefined>(undefined);
    const [selectedImage, setSelectedImage] = useState<MessageMedia | undefined>(undefined);
    const [selectedMediaMessage, setSelectedMediaMessage] = useState<Message | undefined>();
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {
        if (!currentConvo) return;
        setProfiles(Object.fromEntries(
            currentConvo.participants.map(p => [p.id, p])
        ));
    }, []);

    const handleMediaSelect = (message: Message, index: number) => {
        setSelectedMediaMessage(message);
        setSelectedMediaIndex(index);
    };

    const handleMediaReply: () => void = useCallback(() => {
        setReplyMessage(selectedMediaMessage);
        setSelectedMid(selectedMediaMessage?.id);
        setSelectedMediaIndex(0);
        setSelectedMediaMessage(undefined);
    }, [selectedMediaMessage]);

    return <Box w='100%' h={screenHeight} backgroundColor='#111'>
    <Box backgroundColor='#fefefe' h='90px' overflow='hidden' zIndex='1001'>
       <ChatHeader 
            convoName={currentConvo?.name || 'Chat'}
            onSettingsOpen={() => {return;}}
            onProfileOpen={() => {
                setProfileMenuOpen(!profileMenuOpen);
            }}
            onConvoExit={exit} 
        />
    </Box>
    <Box w='100%' h={`${screenHeight - 90} px`} backgroundColor='#fefefe' borderTopLeftRadius='24px' shadow='9' zIndex='1000' >
            {
                profileMenuOpen &&
                <View
                    style={{
                        zIndex: 1001,
                        height: 0,
                        overflow: 'visible'
                    }}>
                    <Box h='200px'>
                    <ConversationProfileManager />
                    </Box>
                </View>
            }
            <View style={{flex: 1}}>
                <VStack w='100%' h='100%' space={1}>
                    <View  
                        style={{
                            height: screenHeight - 90,
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'transparent',
                        }}>
                        <Pressable flex='1' onPress={() => {
                            if (contentMenuOpen) setContentMenuOpen(false);
                            setProfileMenuOpen(false);
                        }}>
                            <MessageList 
                                selectedMid={selectedMid}
                                setSelectedMid={setSelectedMid}
                                setReplyMessage={setReplyMessage}
                                profiles={profiles}
                                closeContentMenu={() => {
                                    setContentMenuOpen(false)
                                    setProfileMenuOpen(false)
                                }}
                                handleMediaSelect={handleMediaSelect} />    
                        </Pressable>
                    </View>
                    <Spacer />
                    <View onLayout={(event: LayoutChangeEvent) => {
                            const {height} = event.nativeEvent.layout;
                            setMessageEntryHeight(height);
                        }}
                        style={{
                            display: 'flex', 
                            flexDirection: 'column',
                            overflow: 'visible',
                            backgroundColor: 'transparent',
                            marginTop: -messageEntryHeight
                        }}>
                        <VStack w='100%' mt='-6px' overflow='visible' bgColor='transparent'>
                            {
                                replyMessage &&
                                <ReplyMessageDisplay 
                                    participants={profiles}
                                    message={replyMessage}
                                    handleDeselect={() => setReplyMessage(undefined)}
                                />
                            }
                            {
                                contentMenuOpen &&
                                <ContentSelectionMenu setMediaBuffer={setSelectedMediaBuffer} closeMenu={() => setContentMenuOpen(false)}/>
                            }
                            <MessageEntry 
                                replyMessage={replyMessage} 
                                onSend={() => {
                                    setReplyMessage(undefined);
                                    setSelectedMid(undefined);
                                }} 
                                openContentMenu={() => setContentMenuOpen(!contentMenuOpen)}
                                selectedMediaBuffer={selectedMediaBuffer}
                                setSelectedMediaBuffer={setSelectedMediaBuffer}
                            />
                        </VStack>
                    </View>
                </VStack>
            </View>
        </Box>

        {
            selectedMediaMessage &&
            <FullScreenMediaFrame
                message={selectedMediaMessage}
                startIndex={selectedMediaIndex}
                setMessage={setSelectedMediaMessage}
                handleReply={handleMediaReply}
            />
        }

        {
            (!networkConnected || socketDisconnected) &&
            <Box marginTop='-180px' zIndex='1003'>
                <NetworkDisconnectionAlert type={networkConnected ? 'server' : 'network'} />
            </Box>
        }
    </Box>
}