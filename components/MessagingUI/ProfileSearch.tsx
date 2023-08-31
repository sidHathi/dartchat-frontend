import React, { useState, useEffect, useRef, useContext, PropsWithChildren, ReactNode, useMemo, useCallback } from "react";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Text, Input, Box, Button, HStack, Spacer, Center, FormControl, VStack } from 'native-base';
import { Image, Keyboard, Pressable } from 'react-native';
import { Entypo } from '@expo/vector-icons';

import useRequest from "../../requests/useRequest";
import { UserConversationProfile, UserProfile } from "../../types/types";
import IconImage from "../generics/IconImage";
import { enc } from "react-native-crypto-js";
import { useAppSelector } from "../../redux/hooks";
import { userDataSelector } from "../../redux/slices/userDataSlice";

const SearchContainer = ({children, searchSelected}: PropsWithChildren<{children: ReactNode, searchSelected: boolean}>) => <Box w='100%' bgColor={searchSelected ? '#fefefe': 'transparent'} p={searchSelected ? '12px' : '0px'} shadow={searchSelected ? '9' : 'none'}borderRadius='12px' style={{shadowOpacity: 0.12}}>
        {children}
    </Box>

export default function ProfilesSearch({
        isGroup,
        encrypted,
        selectedProfiles, 
        setSelectedProfiles,
        addedProfiles,
    } : {
        isGroup: boolean;
        encrypted: boolean;
        selectedProfiles: UserConversationProfile[];
        setSelectedProfiles: (selectedProfiles: UserConversationProfile[]) => void;
        addedProfiles?: UserConversationProfile[];
    }): JSX.Element {
    const inputRef = useRef<any | null>(null);
    const { user } = useContext(AuthIdentityContext);
    const { profilesApi } = useRequest();
    const { contacts: contactIds } = useAppSelector(userDataSelector);

    const [queryString, setQueryString] = useState<string | undefined>(undefined);
    const [matchingProfiles, setMatchingProfiles] = useState<UserProfile[]>([]);
    const [searchSelected, setSearchSelected] = useState(false);
    const [cursor, setCursor] = useState<any>(null);
    const [pulledContacts, setPulledContacts] = useState<UserProfile[] | undefined>();

    useEffect(() => {
        if (inputRef.current && cursor) {
            inputRef.current.cursor = cursor;
        }
    }, [cursor]);

    useEffect(() => {
        if (!contactIds) return;
        const pullContacts = async () => {
            try {
                const profiles = await profilesApi.getProfiles(contactIds);
                setPulledContacts(profiles);
            } catch (err) {
                console.log(err);
                return;
            }
        };
        pullContacts();
    }, [contactIds]);

    const contactMatches = useMemo(() => {
        if (!queryString || !pulledContacts) return undefined;

        return pulledContacts.filter((c) => (
            c.displayName.toLowerCase().includes(queryString.toLowerCase()) || c.handle.toLowerCase().includes(queryString.toLowerCase()) ||
            (c.email && c.email.toLowerCase() === queryString.toLowerCase()) ||
            (c.phone && c.phone.toLowerCase() === queryString.toLowerCase())
        ));
    }, [pulledContacts, queryString])

    const maxSelected = useMemo(() => !isGroup && selectedProfiles.length > 0, [isGroup, selectedProfiles]);

    const filterMatches = useCallback((raw: UserProfile[]) => {
        const contactIds = contactMatches ? contactMatches.map((c) => c.id) : [];
        return raw
            .filter((profile) => {
                return (profile.id !== user?.id)
                    && (!encrypted || profile.publicKey)
            })
            .filter((profile) => {
                return !contactIds.includes(profile.id)
            });
    }, [contactMatches]);

    const pullMatchingUsers = useCallback((qString: string) => {
        if (!qString) return;
        return profilesApi.findProfile(qString)
            .then((matches) => {
                if (matches.length > 0) {
                    setMatchingProfiles(filterMatches(matches));
                } else {
                    setMatchingProfiles([]);
                }
            }).catch((err) => {
                setMatchingProfiles([]);
            })
    }, [contactMatches, filterMatches]);

    const handleQueryInput = useCallback((input: string) => {
        setQueryString(input);
        if (input.length > 0) {
            if (!searchSelected) setSearchSelected(true);
            pullMatchingUsers(input);
        } else {
            setSearchSelected(false);
        }
    }, [searchSelected, pullMatchingUsers]);

    const handleAddProfile = useCallback((profile: UserProfile) => {
        if (maxSelected) return;
        if (addedProfiles && addedProfiles.filter((p) => p.id === profile.id).length > 0) return;
        if (selectedProfiles.filter(
            (p) => p.id === profile.id
        ).length < 1) {
            setSelectedProfiles([...selectedProfiles, {
                id: profile.id,
                displayName: profile.displayName,
                avatar: profile.avatar || undefined,
                handle: profile.handle,
                notifications: 'all',
                publicKey: profile.publicKey,
                role: 'plebian'
            }]);
            setQueryString(undefined);
            setSearchSelected(false);
        }
    }, [addedProfiles, selectedProfiles]);

    const queryInput = (): JSX.Element => {
        if (maxSelected) return <></>
        return (
            <Box w='100%' opacity={
                maxSelected ?
                0.5 :
                1
            }>
                <FormControl>
                <Text fontSize='xs' color='coolGray.600'>
                    {isGroup ? 'Add Participants' : 'Select recipient'}
                </Text>
                <Input
                    ref={inputRef}
                    // autoFocus={true}
                    placeholder='Email, phone number, or username'
                    value={!maxSelected ? queryString: ''}
                    onChangeText={handleQueryInput}
                    w='100%'
                    h='40px'
                    borderRadius='20px'
                    paddingX='20px'
                    marginRight='8px'
                    mt='4px'
                    autoCapitalize='none'
                    backgroundColor='#f1f1f1'
                    onPressOut={() => {
                        if (queryString && queryString.length > 0){
                            setSearchSelected(true)
                        }
                    }}
                    onChange={(e: any) => {
                        setCursor(e.target.value)
                    }}
                    // variant="underlined"
                />
                </FormControl>
            </Box>
        );
    };

    const profileSuggestion = ({profile, onSelect}: {
        profile: UserProfile,
        onSelect: () => void
    }): JSX.Element => (
        <Button variant='ghost' bgColor='#f5f5f5' onPress={onSelect} w='100%' borderRadius='12px' my='4px' px='6px' maxWidth='100%'>
            <HStack px='0' w='100%' space={3}>
                {
                profile.avatar ?
                <IconImage 
                    imageUri={profile.avatar.mainUri}
                    size={36}
                    shadow='9'
                    nbProps={{margin: 'auto'}}
                /> :
                <Image source={require('../../assets/profile-01.png')} 
                    style={{
                        width: 36,
                        height: 36,
                        margin: 'auto'
                    }}/>
                }
                <Box>
                    <Text fontSize='md' fontWeight='bold' m='0'>
                        {profile.displayName}
                    </Text>
                    <Text fontSize='10px' fontWeight='light'>
                        {profile.handle}
                    </Text>
                </Box>
                <Spacer />
                <VStack>
                    <Spacer />
                    <Entypo name="plus" size={24} color="black" />
                    <Spacer />
                </VStack>
            </HStack>
        </Button>
    );
    

    return <>
        <SearchContainer searchSelected={searchSelected}>
            {queryInput()}
            {searchSelected &&
            <Box w='100%'>
                <Center w='100%' my='12px'>
                {
                    (contactMatches && contactMatches.length > 0) &&
                    <Box>
                    <Text fontSize='xs' color='gray.500'>Contacts:</Text>
                    {
                    contactMatches.map((profile, index) => 
                        <Box key={index} w='100%'>
                            { profileSuggestion({
                                profile: profile,
                                onSelect: () => handleAddProfile(profile)
                            }) }
                        </Box>
                    )
                    }
                    </Box>
                }
                {
                contactMatches && filterMatches(matchingProfiles).length > 0 &&
                <Text fontSize='xs' color='gray.500' mr='auto'>Non-contact results:</Text>
                }
                {
                    filterMatches(matchingProfiles).length > 0 &&
                    filterMatches(matchingProfiles).map((profile, index) => 
                        <Box key={index} w='100%'>
                            { profileSuggestion({
                                profile: profile,
                                onSelect: () => handleAddProfile(profile)
                            }) }
                        </Box>
                    )
                }
                {
                    matchingProfiles.length > 0 && !contactMatches &&
                    <Text fontSize='xs' color='gray.500'>
                        No results found
                    </Text>
                }
                </Center>
            </Box>
            }
        </SearchContainer>
    </>;
}