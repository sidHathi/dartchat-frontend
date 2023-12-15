import React, { useCallback, useContext, useMemo } from 'react';
import { useAppSelector } from '../../../redux/hooks';
import { testSelector } from '../../../redux/slices/testSlice';
import TestInstance from '../../../tests/testInstance';
import { Box, Heading, Text, HStack, Icon, Spacer, VStack, FlatList } from 'native-base';
import UIContext from '../../../contexts/UIContext';
import colors from '../../colors';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Spinner from 'react-native-spinkit';

export default function InstanceList({
    testId
}: {
    testId: string
}): JSX.Element {
    const { theme } = useContext(UIContext);
    const { instances } = useAppSelector(testSelector);

    const runs = useMemo(() => {
        if (testId in instances) {
            return instances[testId].length;
        }
        return 0;
    }, [instances, testId]);

    const failures = useMemo(() => {
        if (testId in instances) {
            return instances[testId].reduce<number>((acc, curr) => {
                if (!curr.succeeded && curr.complete) {
                    return acc + 1;
                }
                return acc;
            }, 0);
        }
        return 0;
    }, [instances, testId]);

    const InstancePreview = useCallback(({
        item
    }: { 
        item: TestInstance
    }) => {
        const getTestState = () => {
            if (item.succeeded) {
                return 'Successful'
            } else if (item.complete) {
                return 'Failed'
            } else {
                return 'Running'
            }
        };

        const getDuration = () => {
            if (!item.startedAt || !item.completedAt) {
                return 0;
            }
            return (1/1000)*Math.abs(item.completedAt.getTime() - item.startedAt.getTime());
        };

        return <Box bgColor={colors.bgLight[theme]} p='12px' borderRadius='12px' mt='6px'>
            <HStack>
                <Box>
                    <Text fontSize='md' fontWeight='bold' color={colors.textMainNB[theme]}>
                        {getTestState()}
                    </Text>
                    {
                        item.startedAt &&
                        <Text fontSize='xs' color={colors.textMainNB[theme]}>
                            {`Started: ${item.startedAt.toLocaleString()}`}
                        </Text>
                    }
                    {
                        item.completedAt &&
                            <Text fontSize='xs' color={colors.textMainNB[theme]}>
                            {`Duration: ${getDuration().toString()} sec`}
                        </Text>
                    }
                </Box>
                <Spacer />
                <Box my='auto'>
                {
                    item.succeeded ? <Icon as={AntDesign} name='checkcircle' color='green.500' /> : item.complete ?
                        <Icon as={MaterialIcons} name='cancel' color='green.500' /> : <Spinner size={18} color={colors.spinner[theme]} type='ThreeBounce' />
                }
                </Box>
            </HStack>
        </Box>
    }, [instances, testId, runs, failures]);

    return <Box bgColor={colors.card[theme]} px='15px' py='12px' borderRadius='24px'>
        <VStack space={1}>
            <Text fontSize='11px' color={colors.textLightNB[theme]} fontWeight={'bold'} mb='6px'>
                RESULTS
            </Text>
            <Text fontSize='sm' color={colors.textMainNB[theme]}>
                {`${runs} runs`}
            </Text>
            <Heading fontSize='lg' color={colors.textMainNB[theme]}>
                {`${failures} failures`}
            </Heading>
            {
                testId in instances &&
                <FlatList
                    data={instances[testId]}
                    renderItem={InstancePreview}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                />
            }
        </VStack>
    </Box>
}