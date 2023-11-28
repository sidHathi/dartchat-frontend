import React, { useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { Poll, AvatarImage, UserConversationProfile } from '../../types/types';
import { Box, HStack, VStack, Text, Heading, Icon, Spacer, ScrollView, Pressable, Button } from 'native-base';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import IconImage from '../generics/IconImage';
import IconButton from '../generics/IconButton';
import PollResponder from './PollResponder';
import useRequest from '../../requests/useRequest';
import Spinner from 'react-native-spinkit';
import SocketContext from '../../contexts/SocketContext';
import UIContext from '../../contexts/UIContext';
import colors from '../colors';

export default function PollDisplay({
    pid
}: {
    pid: string
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();
    const { theme } = useContext(UIContext);

    const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | undefined>();
    const [responderOpen, setResponderOpen] = useState(false);
    const [poll, setPoll] = useState<Poll | undefined>();

    useEffect(() => {
        if (!socket || !poll || !currentConvo) return;
        socket.on('pollResponse', (cid: string, uid: string, pid: string, selectedIndices: number[]) => {
            if (currentConvo.id !== cid || pid !== poll.id) return;
            const newOpts = poll.options.map(opt => {
                if (selectedIndices.includes(opt.idx)) {
                    return {
                        ...opt,
                        voters: [
                            ...opt.voters,
                            uid
                        ]
                    }
                }
                return opt;
            });
            if (newOpts !== poll.options) {
                setPoll({
                    ...poll,
                    options: newOpts
                });
            }
        });

        return () => {
            socket.off('pollResponse');
        }
    }, [socket, poll, currentConvo]);

    useEffect(() => {
        const getPoll = async () => {
            if (!currentConvo) return undefined;
            try {
                const fetchedPoll = await conversationsApi.getPoll(currentConvo.id, pid);
                // console.log(fetchedPoll);
                setPoll(fetchedPoll)
                return fetchedPoll;
            } catch (err) {
                console.log(err);
                return undefined;
            }
        }
        getPoll();
    }, [pid, currentConvo]);

    const totalVotes = useMemo(() => {
        if (!poll) return 0;
        return poll.options.reduce((acc, curr) => (
            acc + curr.voters.length
        ), 0);
    }, [poll]);

    const totalVoters = useMemo(() => {
        if (!poll) return 0;
        return poll.options.reduce((acc, curr) => {
            curr.voters.map((v) => acc.add(v));
            return acc;
        }, new Set<string>()).size;
    }, [poll]);

    const winningIndices = useMemo(() => {
        if (!poll) return [];
        if (poll.options.length < 1 || totalVotes < 1) return [];
        const sortedOpts = poll.options.sort((opt1, opt2) => {
            return opt2.voters.length - opt1.voters.length;
        });
        const winningVal = sortedOpts[0].voters.length;
        return sortedOpts
            .filter((opt) => opt.voters.length === winningVal)
            .map((opt) => opt.idx);
    }, [poll]);

    const userOptIndices = useMemo(() => {
        if (!user || !poll) return [];
        const matches = poll.options.filter((opt) => {
            return opt.voters.includes(user.id);
        }).map(opt => opt.idx);
        return matches;
    }, [poll, user]);

    const getProfileForId = useCallback((id: string) => {
        if (!currentConvo || !poll) return undefined;
        const matches = currentConvo.participants.filter((p: UserConversationProfile) => {
            return p.id === id;
        });
        if (matches.length > 0) return matches[0];
        return undefined;
    }, [currentConvo, poll]);

    const getElemForAvatar = (avatar: AvatarImage | undefined) => {
        if (avatar) {
            return <IconImage imageUri={avatar.tinyUri} size={24} />
        }
        return <IconButton label='profile' size={24} />
    };

    const handleOptionSelect = useCallback((optIdx: number) => {
        if (selectedOptionIdx === optIdx) {
            setSelectedOptionIdx(undefined);
        } else {
            setSelectedOptionIdx(optIdx);
        }
    }, [selectedOptionIdx]);
    
    const handleNewResponse = useCallback((selectedIndices: number[]) => {
        if (!socket || !currentConvo || !poll || !user) return;

        socket.emit('pollResponse', currentConvo.id, poll.id, selectedIndices);
        const newOpts = poll.options.map(opt => {
            if (selectedIndices.includes(opt.idx)) {
                return {
                    ...opt,
                    voters: [
                        ...opt.voters,
                        user.id
                    ]
                }
            }
            return opt;
        });
        setPoll({
            ...poll,
            options: newOpts
        });
        setResponderOpen(false);
    }, [socket, currentConvo, poll, user]);

    const userResponded = useMemo(() => {
        if (!user || !poll) return true;
        return poll.options.reduce((acc, opt) => {
            if (opt.voters.includes(user.id)) {
                return true;
            }
            return acc
        }, false);
    }, [user, poll]);

    const PollBar = ({
        option,
        winning
    }: {
        option: {
            idx: number,
            value: string,
            voters: string[]
        },
        winning: boolean
    }) => {
        const widthPer = totalVotes > 0 ? option.voters.length / totalVotes : 0;

        return  <Box 
            borderWidth='1px'
            borderColor='#333'
            borderRadius='9px' h='18px' 
            bgColor={
                winning ? '#333' : '#555'
            } 
            w={`${widthPer*100}%`}
            mt='6px'>
            <HStack my='auto' px='9px' space={1}>
                <Spacer />
                {
                    userOptIndices.includes(option.idx) &&
                    <Icon as={FontAwesome5} name='user-circle' size={3} color='white' my='auto'/>
                }
                {
                winning &&
                <Icon as={Ionicons} name='checkmark' size={4} color='white' />
                }
            </HStack>
        </Box>
    };

    const PollResult = useCallback(({
        option,
        selected,
        winning
    }: {
        option: {
            idx: number,
            value: string,
            voters: string[]
        },
        selected: boolean,
        winning: boolean
    }): JSX.Element => {
        return <Box w='100%' bgColor={colors.bgLight[theme]} borderRadius='12px' py='9px' px='12px'
            shadow={
                selected ? '9' : 'none'
            } style={{
                shadowOpacity: 0.18
            }}
            borderColor='#ddd' borderWidth={userOptIndices.includes(option.idx) ? '1px': '0px'}>
            <VStack w='100%'>
                <HStack w='100%'>
                    <Text fontSize='sm' maxWidth='90%' fontWeight={winning ? 'bold' : 'medium'}>
                        {option.value}
                    </Text>
                    <Spacer />
                    <Text fontWeight={winning ? 'bold' : 'medium'}>
                        {option.voters.length}
                    </Text>
                </HStack>
                {
                    totalVotes > 0 && 
                    <PollBar option={option} winning={winning} />
                }
                {
                    selected &&
                    // <ScrollView maxH='180px' w='100%' h='auto' flexShrink={0}>
                        <VStack w='100%' space={1} mt='6px'>
                            {
                                option.voters.map((voter) => {
                                    const profile = getProfileForId(voter);
                                    if (profile) {
                                        return <HStack space={2} key={voter}>
                                            <Spacer />
                                            {getElemForAvatar(profile.avatar)}
                                            <Text fontSize='xs' my='auto'>
                                                {profile.displayName}
                                            </Text>
                                        </HStack>
                                    }
                                })
                            }
                        </VStack>
                    // </ScrollView>
                }
            </VStack>
        </Box>
    }, [currentConvo, poll]);

    if (!poll) {
        return <Box p='24px' m='auto' bgColor={colors.message[theme]}>
            <Spinner type='ThreeBounce' />
        </Box>
    }

    return <><Box w='100%' bgColor={colors.message[theme]} borderRadius='24px' p='24px'>
        <Text fontSize='xs' fontWeight='bold' color={colors.textLightNB[theme]}>
            Poll
        </Text>
        <Heading fontSize='md' color={colors.textMainNB[theme]}>
            {poll.question}
        </Heading>
        <VStack space={2} mt='12px' w='100%'>
            {
                poll.options.map((opt) => {
                    const winning = winningIndices.includes(opt.idx);
                    return <Pressable onPress={() => handleOptionSelect(opt.idx)} w='100%' key={opt.idx}>
                        <PollResult
                            option={opt}
                            selected={opt.idx === selectedOptionIdx}
                            winning={winning}
                            />
                    </Pressable>
                })
            }
            <Text fontSize='xs' color='gray.500'>
                {`${totalVoters} Responses`}
            </Text>
        </VStack>
        {
        !userResponded &&
        <Button mt='12px' w='100%' borderRadius='24px' colorScheme='light' variant='ghost' onPress={() => setResponderOpen(true)} py='6px'>
            Respond
        </Button>
        }
    </Box>
    <PollResponder 
        isVisible={responderOpen} 
        setIsVisible={setResponderOpen}
        poll={poll}
        handleSubmit={handleNewResponse}
        />
    </>
}