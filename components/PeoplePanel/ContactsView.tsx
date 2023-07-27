import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, VStack, Text, Box, HStack, Spacer, Center } from 'native-base';
import { useAppSelector } from "../../redux/hooks";
import { userDataSelector } from "../../redux/slices/userDataSlice";
import { UserProfile } from "../../types/types";
import useRequest from "../../requests/useRequest";
import IconButton from "../generics/IconButton";
import IconImage from "../generics/IconImage";
import Spinner from "react-native-spinkit";

export default function ContactsView(): JSX.Element {
    const { contacts: contactIds } = useAppSelector(userDataSelector);
    const { profilesApi } = useRequest();

    const [pullRequestLoading, setPullRequestLoading] = useState(false);
    const [contactProfiles, setContactProfiles] = useState<UserProfile[] | undefined>();

    useEffect(() => {
        if (!contactIds) return;
        const pullContacts = async () => {
            setPullRequestLoading(true);
            try {
                const profiles = await profilesApi.getProfiles(contactIds);
                setContactProfiles(profiles);
                setPullRequestLoading(false);
            } catch (err) {
                console.log(err);
                setPullRequestLoading(false);
                return;
            }
        };
        pullContacts();
    }, [contactIds]);

    const getContactAvatarElem = (contact: UserProfile) => {
        if (contact.avatar) {
            return <IconImage imageUri={contact.avatar.tinyUri} size={42} shadow='9'/>;
        }
        return <IconButton label='profile' size={42} shadow="9" />;
    }

    const contactCard = (profile: UserProfile) => {
        return <Box w='100%' borderRadius='12px' bgColor='#f5f5f5'>
            <HStack px='12px' space={3} py='6px'>
                {getContactAvatarElem(profile)}
                <VStack>
                    <Spacer />
                    <Text fontSize='sm' fontWeight='bold'>
                        {profile.displayName}
                    </Text>
                    <Text fontSize='9px' color='gray.500'>
                        {profile.handle}
                    </Text>
                    <Spacer />
                </VStack>
            <Spacer />
            <Center>
                <Box borderRadius='24px' shadow='9' bgColor='#f5f5f5' p='6px' style={{
                    shadowOpacity: 0.12
                }} mx='12px'>
                    <IconButton label='message' color='black' size={24} />
                </Box>
            </Center>
            </HStack>
        </Box>
    }

    return <View flex='1'>
        <Text color='gray.500' fontWeight='bold' fontSize='xs'>
            Contacts
        </Text>
        {
            pullRequestLoading &&
            <Center w='100%' h='100%'>
                <Spinner type='ThreeBounce' />
            </Center>
        }
        {
            (contactProfiles !== undefined && contactProfiles.length > 0) ?
        
            <ScrollView w='100%' h='100%' mt='6px'>
                <VStack space={3}>
                {
                    contactProfiles.map((profile) => <Box key={profile.id}>{contactCard(profile)}</Box>)
                }
                </VStack>
            </ScrollView> :
            <Center flex='1'>
                <Text>
                    No contacts found
                </Text>
            </Center>
        }
    </View>
}
