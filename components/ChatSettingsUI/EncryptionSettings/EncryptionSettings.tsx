import React, { useState, useContext } from 'react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { chatSelector } from '../../../redux/slices/chatSlice';
import { Center, Heading, View, Text, Box, VStack, Button, Spacer } from 'native-base';
import KeyInfoDisplay from './KeyInfoDisplay';
import PrivilegedUsersList from './PrivilegedUsersList';
import SpacedTabs from '../../generics/SpacedTabs';
import ReencryptionModal from './ReencryptionModal';
export default function EncryptionSettings(): JSX.Element {
    /**
     * UI Goals:
     * - should show how many users have access to the current key
     * - should show when the current key was generated
     * - should show how many messages are encrypted with the current key
     * - should show a list of privileged users
     * - should should display a button that pulls up the re-encryption UI
     */
    const { currentConvo } = useAppSelector(chatSelector);

    const [currentMemberList, setCurrentMemberList] = useState(true);
    const [reecnryptionModalOpen, setReencryptionModalOpen] = useState(false);

    const handleTabSelect = (selection: string) => {
        if (selection === 'Current members') {
            setCurrentMemberList(true);
        } else {
            setCurrentMemberList(false);
        }
    };

    const handleResetKey = () => {
        setReencryptionModalOpen(true);
    }

    return <View flex='1' p='12px'>
        <VStack flex='1' h='100%'>
        {
            currentConvo?.keyInfo ?
            <KeyInfoDisplay /> :
            <Center h='100%'>
                <Text>
                    Unencrypted
                </Text>
            </Center>
        }
        {
            currentConvo?.keyInfo &&
            <Box flexGrow='1' flexShrink='0' mb='6px' mt='24px'>
                <SpacedTabs
                    options={['Current members', 'Former members']}
                    selectedOption={
                        currentMemberList ? 'Current members' : 'Former members'
                    }
                    setSelectedOption={handleTabSelect}
                    />
                <PrivilegedUsersList
                    currentMembers={currentMemberList}
                    />
            </Box>
        }
        <Spacer />
        <Button colorScheme='dark' borderRadius='full' variant='subtle'
            onPress={handleResetKey} my='12px'>
            Reset encryption key
        </Button>
        </VStack>

        <ReencryptionModal 
            isOpen={reecnryptionModalOpen}
            onClose={() => setReencryptionModalOpen(false)}
            />
    </View>
}
