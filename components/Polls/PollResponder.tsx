import React, { useState, useCallback } from 'react';
import { Modal, Heading, Text, ScrollView, VStack, Box, HStack, Radio, Checkbox, Spacer, Pressable, Button } from 'native-base';
import { Poll } from '../../types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PollResponder({
    isVisible,
    setIsVisible,
    poll,
    handleSubmit
}: {
    isVisible: boolean;
    setIsVisible: (newVal: boolean) => void;
    poll: Poll,
    handleSubmit: (selectedIndices: number[]) => void;
}): JSX.Element {
    const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);

    const handleSelectOption = useCallback((optIdx: number) => {
        if ( selectedOptionIndices.includes(optIdx) && !poll.multiChoice) {
            setSelectedOptionIndices(selectedOptionIndices.filter((_,idx) => idx !== optIdx));
        } else if (poll.multiChoice) {
            setSelectedOptionIndices([...selectedOptionIndices, optIdx]);
        } else {
            setSelectedOptionIndices([optIdx]);
        }
    }, [selectedOptionIndices]);

    const PollOption = ({
        option,
        selected
    }: {
        option: {
            idx: number,
            value: string,
            voters: string[]
        },
        selected: boolean
    }) => {
        return <Pressable onPress={() => handleSelectOption(option.idx)}>
            <Box px='24px' borderRadius='24px' borderColor='#ddd' borderBottomWidth={'1px'} bgColor={selected ? 'gray.800' : 'transparent'} w='100%' py='9px'>
                <HStack my='auto' w='100%'>
                    <Text color={selected ? 'white': 'gray.800'} fontWeight={selected ? 'bold': 'medium'}>
                        {option.value}
                    </Text>
                    <Spacer />
                    {
                        !poll.multiChoice ?
                        (
                            selected ? <MaterialCommunityIcons name="radiobox-marked" size={24} color="white" /> :
                            <MaterialCommunityIcons name="radiobox-blank" size={24} color="black" />
                        ) :
                        (
                            selected &&
                            <MaterialCommunityIcons name="check" size={24} color="white" />
                        )
                    }
                </HStack>
            </Box>
        </Pressable>
    }

    return <Modal 
        isOpen={isVisible} 
        onClose={
            () => setIsVisible(false)
        }
        size='xl'
    >
        <Modal.Content borderRadius='24px' p='24px'>
            <Modal.CloseButton />
            <Heading fontSize='md'>
                {poll.question}
            </Heading>

            <ScrollView my='24px' w='100%'>
                <VStack space={1}>
                    {
                        poll.options.map((opt) => {
                            const selected = selectedOptionIndices.includes(opt.idx);
                            return <PollOption option={opt} selected={selected} key={opt.idx} />
                        })
                    }
                </VStack>
            </ScrollView>

            <Button w='100%' borderRadius='24px' colorScheme='dark' variant='subtle' onPress={() => handleSubmit(selectedOptionIndices)}>
                Submit
            </Button>
            <Button w='100%' borderRadius='24px' colorScheme='light' variant='subtle' onPress={() => setIsVisible(false)}>
                Cancel
            </Button>
        </Modal.Content>
    </Modal>
}
