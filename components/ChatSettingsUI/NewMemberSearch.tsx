import React, { useMemo } from 'react';
import { Box, Heading, HStack, Spacer, Text, VStack, ScrollView } from 'native-base';
import { UserConversationProfile } from '../../types/types';
import ProfilesSearch from '../MessagingUI/ProfileSearch';
import MemberCard from './MemberCard';
import IconImage from '../generics/IconImage';
import IconButton from '../generics/IconButton';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Touchable } from 'react-native';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { current } from '@reduxjs/toolkit';

export default function NewMemberSearch({
    selectedNewMembers,
    setSelectedNewMembers
}: {
    selectedNewMembers: UserConversationProfile[] | undefined;
    setSelectedNewMembers: (newArr: UserConversationProfile[] | undefined) => void;
}): JSX.Element {
    const { currentConvo } = useAppSelector(chatSelector);

    const handleRemovePnm = (id: string) => {
        if (selectedNewMembers) {
            setSelectedNewMembers(selectedNewMembers.filter((pnm) => pnm.id !== id));
        }
    };

    const convoEncrypted = useMemo(() => {
        return currentConvo?.encryptionLevel !== 'none' || currentConvo.encryptionLevel === undefined
    }, [currentConvo]);

    const PNMCard = ({
        profile
    }: {profile: UserConversationProfile}): JSX.Element => {
        const avatarElem = profile.avatar ? <IconImage imageUri={profile.avatar.mainUri} size={60} shadow='9' /> : <IconButton label='profile' size={60} />;

        return <Box h='70px'><Box w='100%' borderRadius='12px' px='12px' backgroundColor='#f5f5f5' maxHeight='60px' overflow='visible'>
            <HStack space={4}>
                <Box overflow='visible'>
                {avatarElem}
                </Box>
                <VStack h='60px'>
                <Spacer/>
                <Text fontWeight='bold' fontSize='md'>
                    {profile.displayName}
                </Text>
                {
                    profile.handle &&
                    <Text fontSize='xs' color='gray.700'>
                        {profile.handle}
                    </Text>
                }
                <Spacer/>
                </VStack>
                <Spacer />
                <VStack>
                    <Spacer />
                    <TouchableOpacity onPress={() => handleRemovePnm(profile.id)}>
                        <Box bgColor='#f5f5f5' w='48px' borderRadius='24px' h='48px' my='auto'>
                            <Box m='auto'>
                                <Ionicons name="remove-circle-outline" size={24} color="red" />
                            </Box>
                        </Box>
                    </TouchableOpacity>
                    <Spacer />
                </VStack>
            </HStack>
        </Box></Box>
    }

    return <Box mb='12px'>
        <Heading fontSize='lg' mb='12px'>Search</Heading>
        <ProfilesSearch 
            isGroup 
            encrypted={convoEncrypted}
            selectedProfiles={selectedNewMembers || []} 
            setSelectedProfiles={setSelectedNewMembers} 
            addedProfiles={currentConvo?.participants}/>
        <ScrollView maxHeight='500px'>
        {
            selectedNewMembers && selectedNewMembers.length > 0 && 
            selectedNewMembers.map((pnm) => {
                return <Box mt='12px' key={pnm.id} >
                    <TouchableOpacity>
                        <PNMCard profile={pnm} />
                    </TouchableOpacity>
                </Box>
            })
        }
        </ScrollView>
    </Box>
}
