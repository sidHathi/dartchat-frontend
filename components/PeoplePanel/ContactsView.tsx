import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { View, ScrollView, VStack, Text, Box, HStack, Spacer, Center, Input, Icon } from 'native-base';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { userDataSelector } from "../../redux/slices/userDataSlice";
import { Conversation, UserProfile } from "../../types/types";
import useRequest from "../../requests/useRequest";
import IconButton from "../generics/IconButton";
import IconImage from "../generics/IconImage";
import Spinner from "react-native-spinkit";
import ContactsList from "./ContactsList";
import { Ionicons } from "@expo/vector-icons";
import UIContext from "../../contexts/UIContext";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import uuid from 'react-native-uuid';
import { openPrivateMessage } from "../../redux/slices/chatSlice";

export default function ContactsView(): JSX.Element {
    const dispatch = useAppDispatch();
    const { contacts: contactIds, userConversations } = useAppSelector(userDataSelector);
    const { profilesApi } = useRequest();
    const { user } = useContext(AuthIdentityContext);
    const { navSwitch } = useContext(UIContext);
    const { conversationsApi } = useRequest();

    const [pullRequestLoading, setPullRequestLoading] = useState(false);
    const [contactProfiles, setContactProfiles] = useState<UserProfile[] | undefined>();
    const [searchText, setSearchText] = useState<string | undefined>();

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

    const filteredContactProfiles = useMemo(() => {
        if (!contactProfiles) return [];
        if (!searchText) return contactProfiles || [];
        return contactProfiles.filter((p) => (
            p.displayName.toLowerCase().includes(searchText.toLowerCase()) || p.handle.toLowerCase().includes(searchText.toLowerCase())
        ));
    }, [contactProfiles, searchText]);

    const handleMessage = useCallback((profile: UserProfile) => {
        if (!user) return;
        const seedConvo: Conversation = {
            id: uuid.v4() as string,
            settings: {},
            participants: [
                profile,
                {
                    displayName: user.displayName || user.handle || user.email,
                    id: user.id || 'test',
                    handle: user.handle,
                    avatar: user.avatar,
                    notifications: 'all',
                }
            ],
            name: 'Private Message',
            group: false,
            avatar: profile.avatar,
            messages: []
        };
        dispatch(openPrivateMessage(seedConvo, user.id, userConversations, conversationsApi));
        navSwitch('messaging');
        return;
    }, [userConversations, user, conversationsApi, navSwitch]);

    return <View flex='1'>
        <Text color='gray.500' fontWeight='bold' fontSize='xs' px='12px'>
            Contacts
        </Text>
        <Box w='100%' px='12px' py='6px'>
            <Input 
                placeholder="Search" 
                variant="filled" 
                borderRadius="full" 
                py="2" 
                px="2" 
                InputLeftElement={
                    <Icon ml="2" size="4" color="gray.400" as={<Ionicons name="ios-search" />} />
                } 
                onChangeText={setSearchText}
                />
        </Box>
        {
            pullRequestLoading &&
            <Center w='100%' h='100%'>
                <Spinner type='ThreeBounce' />
            </Center>
        }
        {
            (filteredContactProfiles !== undefined && filteredContactProfiles.length > 0) ?
            <View w='100%' flex='1'>
                <ContactsList 
                    contacts={filteredContactProfiles}
                    handleMessage={handleMessage} />
            </View> :
            <Center flex='1'>
                <Text>
                    No contacts found
                </Text>
            </Center>
        }
    </View>
}
