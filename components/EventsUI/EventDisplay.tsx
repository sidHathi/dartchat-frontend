import React, { useState, useCallback, useEffect, useContext, useMemo } from "react";
import { Box, Heading, Text, Button, HStack, CheckIcon, Spacer, ScrollView, VStack, Icon} from 'native-base';
import { AvatarImage, CalendarEvent, UserConversationProfile } from "../../types/types";
import Spinner from "react-native-spinkit";
import useRequest from "../../requests/useRequest";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";
import SocketContext from "../../contexts/SocketContext";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import IconButton from "../generics/IconButton";
import IconImage from "../generics/IconImage";
import { MaterialIcons } from "@expo/vector-icons";
import { getDateTimeString, getTimeString } from "../../utils/messagingUtils";
import UIContext from "../../contexts/UIContext";
import colors from "../colors";
import UIButton from "../generics/UIButton";

export default function EventDisplay({
    eid,
    selected
}: {
    eid: string,
    selected: boolean
}) : JSX.Element {
    const { conversationsApi } = useRequest();
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { theme } = useContext(UIContext)

    const [event, setEvent] = useState<CalendarEvent | undefined>();

    useEffect(() => {
        if (!currentConvo) return;
        const getEvent = async () => {
            const newEvent = await conversationsApi.getEvent(currentConvo.id, eid);
            setEvent(newEvent);
            // console.log(newEvent)
        }
        getEvent();
    }, [eid, currentConvo]);

    const clearUser = useCallback((uid: string) => {
        if (!user || !event) return;
        const newEvent = {
            ...event,
            going: event.going.filter((p) => p !== uid),
            notGoing: event.notGoing.filter((p) => p !== uid),
        }
        if (event !== newEvent) {
            setEvent(newEvent);
        }
    }, [user, event, socket, currentConvo])

    useEffect(() => {
        if (!socket || !event || !currentConvo) return;
        socket.on('eventRsvp', (cid: string, eid: string, uid: string, response: string) => {
            if (cid === currentConvo.id && eid === event.id) {
                let newEvent = event;
                switch (response) {
                    case 'going':
                        if (event.going.includes(uid)) {
                            clearUser(uid);
                            return;
                        }
                        newEvent = {
                            ...event,
                            going: [
                                ...event.going.filter((u) => u !== uid),
                                uid
                            ],
                            notGoing: event.notGoing.filter((u) => u !== uid)
                        }
                        break;
                    case 'notGoing':
                        if (event.notGoing.includes(uid)) {
                            clearUser(uid);
                            return;
                        }
                        newEvent = {
                            ...event,
                            notGoing: [
                                ...event.notGoing.filter((u) => u !== uid),
                                uid
                            ],
                            going: event.going.filter((u) => u !== uid)
                        }
                        break;
                    default:
                        clearUser(uid);
                        return;
                }
                if (newEvent !== event) {
                    setEvent(newEvent);
                }
            }
        });

        return () => {
            socket.off('eventRsvp');
        }
    }, [socket, event, currentConvo])

    const handleEventGoing = useCallback(() => {
        if (!user || !event || !socket || !currentConvo) return; 
        const uid = user.id;
        if (event.going.includes(uid)) {
            clearUser(uid);
            if (socket && currentConvo) socket.emit('eventRsvp', currentConvo.id, event.id, 'undecided');
            return;
        }
        const newEvent = {
            ...event,
            going: [
                ...event.going.filter((u) => u !== uid),
                uid
            ],
            notGoing: event.notGoing.filter((u) => u !== uid)
        }
        socket.emit('eventRsvp', currentConvo.id, event.id, 'going');
        setEvent(newEvent);
    }, [event, socket, currentConvo]);

    const handleEventNotGoing = useCallback(() => {
        if (!user || !event || !socket || !currentConvo) return; 
        const uid = user.id;
        if (event.notGoing.includes(uid)) {
            clearUser(uid);
            if (socket && currentConvo) socket.emit('eventRsvp', currentConvo.id, event.id, 'undecided');
            return;
        }
        const newEvent = {
            ...event,
            notGoing: [
                ...event.notGoing.filter((u) => u !== uid),
                uid
            ],
            going: event.going.filter((u) => u !== uid)
        }
        socket.emit('eventRsvp', currentConvo.id, event.id, 'notGoing');
        setEvent(newEvent);
    }, [event, socket, currentConvo]);

    const userEventState = useMemo(() => {
        if (!user || !event) return undefined;
        if (event.going.includes(user.id)) return 'going';
        if (event.notGoing.includes(user.id)) return 'notGoing';
        return undefined;
    }, [user, event]);

    const goingProfiles = useMemo(() => {
        if (!currentConvo || !event) return [];
        return event.going.map((p) => {
            const matches =  currentConvo.participants.filter((profile) => (
                profile.id === p
            ));
            if (matches.length > 0) return matches[0];
            return undefined;
        }) .filter((p) => p !== undefined) as UserConversationProfile[]
    }, [currentConvo, event]);

    const notGoingProfiles = useMemo(() => {
        if (!currentConvo || !event) return [];
        return event.notGoing.map((p) => {
            const matches =  currentConvo.participants.filter((profile) => (
                profile.id === p
            ));
            if (matches.length > 0) return matches[0];
            return undefined;
        }) .filter((p) => p !== undefined) as UserConversationProfile[]
    }, [currentConvo, event]);

    const getProfileForAvatar = (avatar?: AvatarImage) => {
        if (!avatar) {
            return <IconButton label='profile' size={24} shadow='none'/>
        }
        return <IconImage imageUri={avatar.tinyUri} size={24} />
    };

    if (!event) {
        return <Box borderRadius='24px' bgColor={colors.message[theme]} p='24px'>
            <Spinner type='ThreeBounce' color={colors.spinner[theme]} />
        </Box>;
    }

    return <Box w='100%' borderRadius='24px' bgColor={colors.message[theme]} p='24px' flexGrow='0'>
        <Text fontWeight='bold' color={colors.subTextNB[theme]} fontSize='xs' m='0'>
            Event
        </Text>
        <Heading fontSize='md' color={colors.textMainNB[theme]}>
            {event.name}
        </Heading>
        <Text color={colors.textMainNB[theme]}>
            {event.date && `${getDateTimeString(event.date)}`}
        </Text>

        <HStack space={1} mt='24px'>
            <UIButton 
                w='48%' 
                borderRadius='24px' 
                context={userEventState === 'going' ? 'primary' : 'outline'} borderWidth='1px' 
                borderColor='#333' 
                onPress={handleEventGoing}
                leftIconProps={{
                    as: undefined,
                    name: 'check',
                    check: true,
                }}
            >
                Going
            </UIButton>
            <Spacer />
            <UIButton 
                w='48%' 
                borderRadius='24px' 
                context={userEventState === 'notGoing' ? 'primary' : 'outline'} borderWidth='1px' 
                borderColor='#333'
                leftIconProps={{
                    as: MaterialIcons,
                    name: 'cancel',
                }}
                // leftIcon={<Icon as={MaterialIcons} name='cancel' />} 
                onPress={handleEventNotGoing}>
                Not Going
            </UIButton>
        </HStack>

        {
            selected && event && (event.notGoing.length + event.going.length > 0) &&
            <HStack mt='12px'>
                <ScrollView maxH='180px' w='48%' overflow='hidden'>
                <VStack space={1}>
                    <Text fontSize='xs' color='gray.500' mb='3px'>
                        Going:
                    </Text>
                    {
                        goingProfiles.map((p) => (
                            <HStack space={2} key={p.id}>
                                {getProfileForAvatar(p.avatar)}
                                <Text fontSize='xs' my='auto'>
                                    {p.displayName}
                                </Text>
                            </HStack>
                        ))
                    }
                </VStack>
                </ScrollView>
                <Spacer />
                <ScrollView maxH='180px' w='48%' overflow='hidden'>
                <VStack space={1}>
                    <Text fontSize='xs' color='gray.500'>
                        Not going:
                    </Text>
                    {
                        notGoingProfiles.map((p) => (
                            <HStack space={2} key={p.id}>
                                {getProfileForAvatar(p.avatar)}
                                <Text fontSize='xs' my='auto' isTruncated={true}>
                                    {p.displayName}
                                </Text>
                            </HStack>
                        ))
                    }
                </VStack>
                </ScrollView>
            </HStack>
        }
    </Box>
}
