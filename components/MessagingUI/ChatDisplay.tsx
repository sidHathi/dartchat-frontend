import React, { useState, useContext, useEffect, useRef } from 'react';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Conversation, Message, UserConversationProfile } from '../../types/types';
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
    const [heightDif, setHeightDif] = useState(0);
    const [profiles, setProfiles] = useState<{[id: string]: UserConversationProfile}>({});

    useEffect(() => {
        if (!currentConvo) return;
        setProfiles(Object.fromEntries(
            currentConvo.participants.map(p => [p.id, p])
        ));
    }, []);

    return <Box w='100%' h={screenHeight} backgroundColor='#222'>
    <Box backgroundColor='#fefefe' h='90px' overflow='hidden' zIndex='1001'>
       <ChatHeader 
            convoName={currentConvo?.name || 'Chat'}
            onSettingsOpen={() => {return;}}
            onProfileOpen={logOut}
            onConvoExit={exit} 
        />
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
                    <MessageList 
                        selectedMid={selectedMid}
                        setSelectedMid={setSelectedMid}
                        setReplyMessage={setReplyMessage}
                        profiles={profiles} />
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
                                setSelectedMid(undefined);
                            }} />
                        </Box>
                    </VStack>
                </View>
            </VStack>
=        </Box>


        {
            (!networkConnected || socketDisconnected) &&
            <Box marginTop='-180px' zIndex='1003'>
                <NetworkDisconnectionAlert type={networkConnected ? 'server' : 'network'} />
            </Box>
        }
    </Box>
}