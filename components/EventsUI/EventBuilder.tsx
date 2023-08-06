import React, { useState, useMemo, useCallback, useEffect, useContext } from "react";
import { View, Box, Input, Text, Heading, VStack, Button, Icon, CheckIcon, Select, ScrollView } from "native-base";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getDateTimeString } from "../../utils/messagingUtils";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import uuid from 'react-native-uuid';
import { CalendarEvent, DecryptedMessage, Message, ObjectRef } from "../../types/types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, sendNewMessage } from "../../redux/slices/chatSlice";
import useRequest from "../../requests/useRequest";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import SocketContext from "../../contexts/SocketContext";
import { useKeyboard } from "@react-native-community/hooks";

type ReminderTime = '@' | '10min' | '30min' | '1hr' | '1day' | 'none';

export default function EventBuilder({
    close
}: {
    close: () => void;
}): JSX.Element {
    const screenHeight = Dimensions.get('window').height;

    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();
    const { keyboardShown, keyboardHeight } = useKeyboard();

    const [eventName, setEventName] = useState<string | undefined>();
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [eventDate, setEventDate] = useState<Date | undefined>();
    const [reminderTimes, setReminderTimes] = useState<ReminderTime[]>(['@']);
    const [createRequestLoading, setCreateRequestLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        if (reminderTimes.includes('none')) {
            setReminderTimes(reminderTimes.filter((r) => r !== 'none'));
        }
    }, [reminderTimes])

    const availableReminderTimes = useMemo(() => {
        const possibleReminderTimes: ReminderTime[] = ['@', '10min', '30min', '1hr', '1day'];
        return possibleReminderTimes.filter(t => !reminderTimes.includes(t));
    }, [reminderTimes]);

    const addReminderTime = useCallback(() => {
        setReminderTimes([
            ...reminderTimes,
            availableReminderTimes[0]
        ])
    }, [reminderTimes, availableReminderTimes]);

    const getTextForReminderTime = (reminderTime: ReminderTime) => {
        switch (reminderTime) {
            case '@':
                return 'At the time of the event';
            case '10min':
                return '10 minutes before the event';
            case '30min':
                return '30 minutes before the event';
            case '1hr':
                return '1 hour before the event';
            case '1day':
                return '1 day before the event';
            default:
                return '- Remove reminder'
        }
    };

    const getDateForReminderTime = (date: Date, rt: ReminderTime) => {
        let raw = (new Date()).getTime();
        switch (rt) {
            case '@':
                raw = date.getTime();
                return new Date(raw);
            case '10min':
                raw = date.getTime() - 10*60*1000;
                return new Date(raw);
            case '30min':
                raw = date.getTime() - 30*60*1000;
                return new Date(raw);
            case '1hr':
                raw = date.getTime() - 60*60*1000;
                return new Date(raw);
            case '1day':
                raw = date.getTime() - 24*60*60*1000;
                return new Date(raw);
            default:
                return new Date()
        }
    };

    const reminderDates = useMemo(() => {
        if (!eventDate) return;
        return reminderTimes.map((rt) => getDateForReminderTime(eventDate, rt));
    }, [reminderTimes, eventDate])

    const handleDatePick = (newDate: Date) => {
        setEventDate(newDate);
        setDatePickerOpen(false);
    };

    const editField = ({value, setValue, prompt}: {
        value: string | undefined;
        setValue: (newVal: string) => void;
        prompt: string;
    }): JSX.Element => {
        return <Box w='100%'>
            <Text fontSize='11px' color='coolGray.600'>
                {prompt}
            </Text>
            <Input
                placeholder={prompt}
                value={value}
                onChangeText={setValue}
                w='100%'
                h='40px'
                px='4px'
                marginRight='8px'
                variant="underlined"
                fontWeight='bold'
                fontSize='md'
                bgColor='#fefefe'
                my='6px'
                multiline
                numberOfLines={3}
            />
        </Box>
    };

    const DateView = useMemo(() => {
        if (!eventDate) return null;
        const eventDateString = getDateTimeString(eventDate);
        return <Box w='100%' my='12px'>
            <Text fontSize='xs' color='gray.500'>
                Scheduled for
            </Text>
            <Box py='12px' borderBottomColor='#777' borderBottomWidth='1px'>
            <Heading fontSize='md'>
                {eventDateString}
            </Heading>
            </Box>
        </Box>
    }, [eventDate]);

    const buildEvent = useCallback(async () => {
        if (!currentConvo) return undefined;
        if (!eventName || !eventDate) {
            setError('Complete required fields');
            return;
        }
        const newEvent: CalendarEvent = {
            id: uuid.v4() as string,
            name: eventName,
            date: eventDate,
            reminders: reminderDates || [],
            going: [],
            notGoing: []
        };
        setCreateRequestLoading(true);
        try {
            await conversationsApi.addEvent(currentConvo.id, newEvent);
            setCreateRequestLoading(false);
            return newEvent;
        } catch (err) {
            console.log(err);
            setCreateRequestLoading(false);
            return undefined;
        }
    }, [eventName, eventDate, reminderDates]);

    const handleSubmit = useCallback(async () => {
        if (!currentConvo || !user || !socket) return;
        try {
            const event = await buildEvent();
            if (event) {
                const ref: ObjectRef = {
                    id: event.id,
                    type: 'event'
                };
                const messageId = uuid.v4().toString();
                const userMatches = currentConvo.participants.filter(u => u.id === user.id);
                const message: DecryptedMessage = {
                    id: messageId,
                    content: `Event: ${eventName}`,
                    timestamp: new Date(),
                    senderId: user.id,
                    likes: [],
                    senderProfile: userMatches.length > 0 ? userMatches[0] : undefined,
                    objectRef: ref,
                    messageType: 'user',
                    encryptionLevel: 'none'
                }
                dispatch(sendNewMessage({socket, message}));
                socket.emit('scheduleEvent', currentConvo.id, event);
                close();
            }
        } catch (err) {
            console.log(err);
            setError('Network request failed');
        }
    }, [buildEvent])

    return <View w='100%'  h={keyboardShown ? `${keyboardHeight + 2*screenHeight/3}px`: `${2*screenHeight/3}px`} maxH={`${3*screenHeight/4}px`}>
        <Box w='96%' minH='100%' flexShrink='0'>
            <Heading fontSize='lg' mb='12px'>
                Create an Event
            </Heading>
            {
            editField({
                value: eventName,
                setValue: setEventName, 
                prompt: 'Name the event'
                })
            }
            {
                eventDate &&
                DateView
            }
            <Button 
                w='100%'
                my='12px'
                variant='subtle'
                colorScheme='light' 
                borderRadius='24px'
                leftIcon={<Icon as={MaterialIcons} name='event' />} 
                onPress={() => setDatePickerOpen(true)}>
                {`${eventDate !== undefined ? 'Change': 'Select'} event date`}
            </Button>

            <Text fontSize='sm' fontWeight='bold' mt='12px'>
                Remind me
            </Text>
            <ScrollView showsVerticalScrollIndicator={true} flexGrow='0' flexShrink='1' maxH={`${screenHeight/7}px`}>
            <VStack>
            {
                reminderTimes.map((_, idx) => (
                    <Select 
                    // @ts-ignore-next-line
                    optimized={false}
                    fontWeight='bold' key={idx}
                    selectedValue={reminderTimes[idx]} w='100%' h='48px' borderRadius='24px' accessibilityLabel="Choose Poll Duration" placeholder="Choose Poll Duration" borderWidth='0px' bgColor='#f7f7f7' px='24px' mb='12px'
                    _selectedItem={{
                        fontWeight: 'bold',
                        borderRadius: '30px',
                        bg: "#f1f1f1",
                        endIcon: <CheckIcon size="5" />
                    }}
                    onValueChange={itemValue => {
                        setReminderTimes(reminderTimes.map((rti, idxi) => {
                            if (idxi === idx) return itemValue as ReminderTime;
                            return rti;
                        }))
                    }}>
                        <Select.Item label={getTextForReminderTime('@')} value="@" />
                        <Select.Item label={getTextForReminderTime('10min')} value="10min" />
                        <Select.Item label={getTextForReminderTime('30min')} value="30min" />
                        <Select.Item label={getTextForReminderTime('1hr')} value="1hr" />
                        <Select.Item label={getTextForReminderTime('1day')} value="1day" />
                        <Select.Item label={getTextForReminderTime('none')} value="none" />
                    </Select>
                ))
            }
            </VStack>
            </ScrollView>
            <Button 
                w='100%'
                mb='12px'
                py='9px'
                variant='ghost'
                colorScheme='light' 
                borderRadius='24px'
                onPress={addReminderTime}
                leftIcon={<Icon as={AntDesign} name='pluscircle' />}>
                Add reminder time
            </Button>

            <Button 
                w='100%'
                my='12px'
                variant='subtle'
                colorScheme='dark' 
                borderRadius='24px'
                onPress={handleSubmit}
                leftIcon={<Icon as={Ionicons} name='ios-send' size='sm'/>}>
                Create
            </Button>
            <Button 
                w='100%'
                variant='subtle'
                colorScheme='light' 
                borderRadius='24px'
                onPress={close}>
                Cancel
            </Button>
        </Box>

        <DateTimePickerModal 
            minimumDate={new Date()}
            display='inline' 
            isVisible={datePickerOpen}
            mode='datetime'
            onConfirm={handleDatePick}
            onCancel={() => setDatePickerOpen(false)}
            />
    </View>
}
