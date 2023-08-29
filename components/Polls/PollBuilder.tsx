import React, { useState, useCallback, useContext } from "react";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { View, Box, Input, HStack, VStack, ScrollView, Heading, Text, Button, Icon, IconButton, Spacer, Select, CheckIcon, Center } from 'native-base';
import { Dimensions } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Poll, Message, ObjectRef, UserConversationProfile, DecryptedMessage } from "../../types/types";
import uuid from 'react-native-uuid';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { chatSelector, sendNewMessage } from "../../redux/slices/chatSlice";
import SocketContext from "../../contexts/SocketContext";
import { handleNewMessage } from "../../redux/slices/userDataSlice";
import useRequest from "../../requests/useRequest";
import Spinner from "react-native-spinkit";
import { useKeyboard } from "@react-native-community/hooks";
import { encryptMessageForConvo } from "../../utils/messagingUtils";
import UserSecretsContext from "../../contexts/UserSecretsContext";

type Timeframe = 'hr' | 'day' | 'week';

export default function PollBuilder({
    close
}: {
    close: () => void;
}) : JSX.Element {
    const screenHeight = Dimensions.get('window').height;

    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();
    const { keyboardShown, keyboardHeight } = useKeyboard();
    const { secrets } = useContext(UserSecretsContext);

    const [question, setQuestion] = useState<string | undefined>();
    const [options, setOptions] = useState<string[]>([
        '', ''
    ]);
    const [multiSelect, setMultiSelect] = useState(false);
    const [timeframe, setTimeFrame] = useState<Timeframe>('hr');
    const [error, setError] = useState<string | undefined>();
    const [pollReqLoading, setPollReqLoading] = useState(false);

    const getExpiration = (timeframe: Timeframe): Date => {
        switch (timeframe) {
            case 'hr':
                return new Date(((new Date()).getTime() + 60*60*1000));
                break;
            case 'day':
                return new Date(((new Date()).getTime() + 24*60*60*1000));
            case 'week':
                return new Date((new Date()).getTime() + 7*24*60*60*1000);
            default:
                return new Date();
        }
    };

    const constructPoll: () => Promise<Poll | undefined> = useCallback(async () => {
        if (!question) {
            setError('Complete required fields')
            return;
        }
        const filteredOptions = options.filter(opt => opt.length > 0);
        if (filteredOptions.length < 0) {
            setError('Complete required fields')
            return;
        }

        const poll: Poll = {
            id: uuid.v4() as string,
            multiChoice: multiSelect,
            question,
            options: filteredOptions.map((opt, idx) => ({
                idx: idx + 1,
                value: opt,
                voters: []
            })),
            expirationDate: getExpiration(timeframe),
            messageLink: uuid.v4().toString()
        }
        if (currentConvo) {
            setPollReqLoading(true);
            try {
                const updateRes = await conversationsApi.addPoll(currentConvo.id, poll);
                if (updateRes) {
                    return poll;
                }
                setPollReqLoading(false);
            } catch (err) {
                setPollReqLoading(false);
                console.log(err);
            }
        }
        return;
    }, [options, question, timeframe, multiSelect, currentConvo]);

    const handleSend = useCallback(async () => {
        if (!user || !currentConvo || !socket) return;
        const poll = await constructPoll();
        if (!poll) return;
        const userMatches = currentConvo.participants.filter((u: UserConversationProfile) => u.id === user.id);
        const ref: ObjectRef = {
            id: poll.id,
            type: 'poll'
        };
        const messageId = poll.messageLink || uuid.v4().toString();
        const message: DecryptedMessage = {
            id: messageId,
            content: `Poll: ${question}`,
            timestamp: new Date(),
            senderId: user.id,
            likes: [],
            senderProfile: userMatches.length > 0 ? userMatches[0] : undefined,
            objectRef: ref,
            messageType: 'user',
            encryptionLevel: 'none',
            inGallery: false
        };

        const userSecretKey = secrets ? secrets.userSecretKey : undefined;
        const encryptedMessage = encryptMessageForConvo(message, currentConvo, userSecretKey);
        if (socket && currentConvo) {
            console.log('sending message')
            dispatch(sendNewMessage({socket, message: encryptedMessage}));
            socket.emit('schedulePoll', currentConvo.id, poll);
            // dispatch(handleNewMessage({cid: currentConvo.id, message: message, messageForCurrent: true}));
            close();
        }
    }, [user, currentConvo, socket, question, timeframe, multiSelect, options, secrets, constructPoll, close]);

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

    const setOption = useCallback((index: number, newVal: string) => {
        const newArr = options.map((opt, idx) => {
            if (idx !== index) return opt;
            return newVal;
        });
        setOptions(newArr);
    }, [options]);

    const addOption = useCallback(() => {
        if (options.length >= 7) return;
        setOptions([...options, '']);
    }, [options]);

    const removeOption = useCallback((idx: number) => {
        if (options.length < 3) return;
        const newOptions = options
            .filter((_, i) => i !== idx);
        setOptions(newOptions);
    }, [options])

    return <View h={keyboardShown ? `${0.8*screenHeight - 90 + keyboardHeight}px`:`${0.8*screenHeight - 90}px`} flexShrink='0' w='100%'>
        <Box w='96%' m='auto' h='100%' flexShrink='0'>
            <Heading fontSize='lg'>
                Create a Poll
            </Heading>

            <Button.Group isAttached my='12px' w='100%'>
                <Button borderLeftRadius='30px' colorScheme={multiSelect ? 'light' : 'dark'} variant={multiSelect ? 'outline' : 'subtle'} onPress={() => setMultiSelect(false)} marginX='0' w='50%'>
                    Single response
                </Button>
                <Button borderRightRadius='30px' colorScheme={!multiSelect ? 'light' : 'dark'} variant={!multiSelect ? 'outline' : 'subtle'} onPress={() => setMultiSelect(true)} marginX='0' w='50%'>
                    Multiple response
                </Button>
            </Button.Group>

            <Text fontSize='11px' color='coolGray.600' mb='4px'>Choose duration</Text>
            <Select fontWeight='bold'
            selectedValue={timeframe} w='100%' h='48px' borderRadius='24px' accessibilityLabel="Choose Poll Duration" placeholder="Choose Poll Duration" borderWidth='0px' bgColor='#f7f7f7' px='24px' mb='12px'
            _selectedItem={{
                fontWeight: 'bold',
                borderRadius: '30px',
                bg: "#f1f1f1",
                endIcon: <CheckIcon size="5" />
            }}
            onValueChange={itemValue => setTimeFrame(itemValue as Timeframe)}>
                <Select.Item label="1 hour" value="hr" />
                <Select.Item label="1 day" value="day" />
                <Select.Item label="1 week" value="week" />
            </Select>

            <Box mb='12px'>
            {
            editField({
                value: question,
                setValue: setQuestion, 
                prompt: 'Ask a question'
                })
            }
            </Box>
            <ScrollView maxH={`${0.7*screenHeight - 90}px`} minH='200px' flexGrow='1'>
            <VStack space='2' w='100%'>
            {
                options.map((opt, idx) => {
                    return <HStack space='2' flexGrow='1' key={idx}>
                    {editField({
                        value: opt,
                        setValue: (newVal: string) => setOption(idx, newVal),
                        prompt: `Option ${idx + 1}`
                    })}
                    <IconButton icon={
                        <Icon as={Ionicons} name='remove-circle' size='md' color='dark.300'/>}
                        borderRadius='full' ml='-40px' mt='18px'
                        onPress={() => removeOption(idx)}/>
                    </HStack>
                })
            }
            <Button w='100%' colorScheme='light' variant='subtle' leftIcon={
                <Icon as={AntDesign} name='pluscircle' size='md' />
            } borderRadius='24px' onPress={addOption}>
                Add another option
            </Button>
            </VStack>
            </ScrollView>

            {
                !pollReqLoading && error &&
                <Text w='100%' textAlign='center' fontSize='xs' color='red.500'>{error}</Text>
            }
            {
                pollReqLoading &&
                <Center w='100%'>
                    <Spinner type='ThreeBounce' />
                </Center>
            }
            <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' onPress={handleSend} my='6px'
            leftIcon={<Icon as={Ionicons} name='ios-send' size='sm'/>}>
                Send
            </Button>
            <Button colorScheme='light' variant='subtle' w='100%' borderRadius='24px' onPress={close} my='3px'>
                Cancel
            </Button>
        </Box>
    </View>
}
