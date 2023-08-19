import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Conversation, DecryptedMessage, Message, MessageMedia, MessageMediaBuffer, UserConversationProfile } from '../../types/types';
import {Box, VStack, HStack, Spacer, Heading, Pressable, Center} from 'native-base';
import { View } from 'react-native';
import MessageEntry from './MessageEntry';
import { Dimensions } from 'react-native';
import ReplyMessagePreview from './ReplyMessagePreview';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { chatSelector, handleMessageDelete as reduxMessageDelete } from '../../redux/slices/chatSlice';
import FullScreenMediaFrame from './MessageMediaControllers/FullScreenMediaFrame';
import MessageList from './MessageList';
import ContentSelectionMenu from './ContentSelectionMenu';
import UserDetailsModal from '../ChatSettingsUI/UserDetailsModal';
import RemoveUserModal from '../ChatSettingsUI/RemoveUserModal';
import useRequest from '../../requests/useRequest';
import SocketContext from '../../contexts/SocketContext';
import ConfirmationModal from '../generics/ConfirmationModal';

export default function ChatDisplay({closeOverlays}: {
    closeOverlays: () => void
}): JSX.Element {
    const screenHeight = Dimensions.get('window').height;

    const { currentConvo } = useAppSelector(chatSelector);
    const dispatch = useAppDispatch();
    const { socket } = useContext(SocketContext);

    const [selectedMid, setSelectedMid] = useState<string | undefined>(undefined);
    const [replyMessage, setReplyMessage] = useState<DecryptedMessage | undefined>(undefined);
    const [profiles, setProfiles] = useState<{[id: string]: UserConversationProfile}>({});
    const [contentMenuOpen, setContentMenuOpen] = useState(false);
    const [selectedMediaBuffer, setSelectedMediaBuffer] = useState<MessageMediaBuffer[] | undefined>(undefined);
    const [selectedMediaMessage, setSelectedMediaMessage] = useState<DecryptedMessage | undefined>();
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [pollBuilderOpen, setPollBuilderOpen] = useState(false);
    const [eventBuilderOpen, setEventBuilderOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<UserConversationProfile | undefined>();
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [removeUserModalOpen, setRemoveUserModalOpen] = useState(false);
    const [confirmMessageDeleteModalOpen, setConfirmMessageDeleteModalOpen] = useState(false);
    const [upForDeleteMid, setUpForDeleteMid] = useState<string | undefined>();

    useEffect(() => {
        if (!currentConvo) return;
        setProfiles(Object.fromEntries(
            currentConvo.participants.map(p => [p.id, p])
        ));
    }, []);

    const handleMediaSelect = (message: DecryptedMessage, index: number) => {
        setSelectedMediaMessage(message);
        setSelectedMediaIndex(index);
    };

    const handleMediaReply: () => void = useCallback(() => {
        setReplyMessage(selectedMediaMessage);
        setSelectedMid(selectedMediaMessage?.id);
        setSelectedMediaIndex(0);
        setSelectedMediaMessage(undefined);
    }, [selectedMediaMessage]);

    const handleRemove = (profile: UserConversationProfile) => {
        setSelectedProfile(profile);
        setUserDetailModalOpen(false);
        setRemoveUserModalOpen(true);
        return;
    };

    const confirmMessageDelete = useCallback(() => {
        if (!currentConvo || !socket || !upForDeleteMid) return;
        try {
            socket.emit('deleteMessage', currentConvo.id, upForDeleteMid);
            dispatch(reduxMessageDelete(upForDeleteMid));
            setUpForDeleteMid(undefined);
            setConfirmMessageDeleteModalOpen(false);
        } catch (err) {
            console.log(err);
        }
    }, [currentConvo, socket, upForDeleteMid]);

    const handleMessageDelete = (mid: string) => {
        setUpForDeleteMid(mid);
        setConfirmMessageDeleteModalOpen(true);
    }

    return <View style={{flex: 1}}>
        <VStack w='100%' h='100%'>
            <View  
                style={{
                    height: screenHeight - 120,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'transparent',
                    flexGrow: 1,
                    flexShrink: 1,
                }}>
                <Pressable flex='1' onPress={() => {
                    if (contentMenuOpen) setContentMenuOpen(false);
                    setPollBuilderOpen(false);
                    setEventBuilderOpen(false);
                    closeOverlays();
                }}>
                    <MessageList
                        selectedMid={selectedMid}
                        setSelectedMid={(newMid: string | undefined) => {
                            setSelectedMid(newMid);
                            setPollBuilderOpen(false);
                            setEventBuilderOpen(false);
                        }}
                        setReplyMessage={setReplyMessage}
                        profiles={profiles}
                        closeContentMenu={() => {
                            setContentMenuOpen(false)
                            closeOverlays()
                        }}
                        handleMediaSelect={handleMediaSelect}
                        handleProfileSelect={(profile: UserConversationProfile) => {
                            setSelectedProfile(profile);
                            setUserDetailModalOpen(true);
                        }} 
                        handleMessageDelete={handleMessageDelete}
                        />    
                </Pressable>
            </View>
            <Spacer />
            <View style={{
                    display: 'flex', 
                    flexDirection: 'column',
                    overflow: 'visible',
                    backgroundColor: 'transparent',
                    marginTop: -100,
                    flexShrink: 0,
                    flexGrow: 0,
                }}>
                <VStack w='100%' mt='-6px' overflow='visible' bgColor='transparent'>
                    {
                        replyMessage &&
                        <ReplyMessagePreview 
                            participants={profiles}
                            message={replyMessage}
                            handleDeselect={() => setReplyMessage(undefined)}
                        />
                    }
                    {
                        contentMenuOpen &&
                        <ContentSelectionMenu 
                            setMediaBuffer={setSelectedMediaBuffer} 
                            closeMenu={() => setContentMenuOpen(false)}
                            openPollBuilder={() => setPollBuilderOpen(true)}
                            openEventBuilder={() => setEventBuilderOpen(true)}
                            />
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
                        pollBuilderOpen={pollBuilderOpen}
                        setPollBuilderOpen={setPollBuilderOpen}
                        eventBuilderOpen={eventBuilderOpen}
                        setEventBuilderOpen={setEventBuilderOpen}
                    />
                </VStack>
            </View>
        </VStack>
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
            currentConvo && currentConvo.group && selectedProfile &&
            <UserDetailsModal
                isOpen={userDetailModalOpen}
                handleClose={() => setUserDetailModalOpen(false)}
                profile={selectedProfile}
                navToMessages={() => {return;}}
                handleRemove={() => handleRemove(selectedProfile)}
                />
        }
        {
            currentConvo && currentConvo.group && selectedProfile &&
            <RemoveUserModal
                isOpen={removeUserModalOpen}
                handleClose={() => setRemoveUserModalOpen(false)}
                profile={selectedProfile}
                onRemove={() => setSelectedProfile(undefined)} />
        }
        {
            currentConvo && upForDeleteMid &&
            <ConfirmationModal
                isOpen={confirmMessageDeleteModalOpen}
                onClose={() => {
                    setConfirmMessageDeleteModalOpen(false);
                    setUpForDeleteMid(undefined);
                }}
                onConfirm={confirmMessageDelete}
                title='Confirm message deletion'
                content='This action is irreversible'
                size='lg'
                />
        }
    </View>
}