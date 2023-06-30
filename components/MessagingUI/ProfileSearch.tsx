import React, { useState, useEffect, useRef, useContext, PropsWithChildren, ReactNode } from "react";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Text, Input, Box, Button, HStack, Spacer, Center, FormControl } from 'native-base';
import { Image, Pressable } from 'react-native';
import { Entypo } from '@expo/vector-icons';

import useRequest from "../../requests/useRequest";
import { UserConversationProfile, UserProfile } from "../../types/types";

const SearchContainer = ({children, searchSelected}: PropsWithChildren<{children: ReactNode, searchSelected: boolean}>) => <Box w='100%' bgColor={searchSelected ? '#fefefe': 'transparent'} p={searchSelected ? '12px' : '0px'} shadow={searchSelected ? '9' : 'none'}borderRadius='12px'>
        {children}
    </Box>

export default function ProfilesSearch({
        isGroup,
        selectedProfiles, 
        setSelectedProfiles
    } : {
        isGroup: boolean;
        selectedProfiles: UserConversationProfile[];
        setSelectedProfiles: (selectedProfiles: UserConversationProfile[]) => void;
    }): JSX.Element {
    const inputRef = useRef<any | null>(null);
    const { user } = useContext(AuthIdentityContext);
    const { profilesApi } = useRequest();

    const [queryString, setQueryString] = useState<string | undefined>(undefined);
    const [matchingProfiles, setMatchingProfiles] = useState<UserProfile[]>([]);
    const [searchSelected, setSearchSelected] = useState(false);
    const [cursor, setCursor] = useState<any>(null);

    useEffect(() => {
        if (inputRef.current && cursor) {
            inputRef.current.cursor = cursor;
        }
    }, [cursor])

    const maxSelected = () => !isGroup && selectedProfiles.length > 0;

    const pullMatchingUsers = (qString: string) => {
        if (!qString) return;
        return profilesApi.findProfile(qString)
            .then((matches) => {
                if (matches.length > 0) {
                    setMatchingProfiles(matches.filter(profile => {
                        return profile.id !== user?.id
                    }));
                } else {
                    setMatchingProfiles([]);
                }
            }).catch((err) => {
                setMatchingProfiles([]);
            })
    }

    const handleQueryInput = (input: string) => {
        setQueryString(input);
        if (input.length > 0) {
            if (!searchSelected) setSearchSelected(true);
            pullMatchingUsers(input);
        } else {
            setSearchSelected(false);
        }
    }

    const handleAddProfile = (profile: UserProfile) => {
        if (maxSelected()) return;
        if (selectedProfiles.filter(
            (p) => p.id === profile.id
        ).length < 1) {
            setSelectedProfiles([...selectedProfiles, {
                id: profile.id,
                displayName: profile.displayName,
                profilePic: profile.profilePic || {}
            }]);
            setQueryString(undefined);
            setSearchSelected(false);
        }
    };

    const queryInput = (): JSX.Element => {
        if (maxSelected()) return <></>
        return (
            <Box w='100%' opacity={
                maxSelected() ?
                0.5 :
                1
            }>
                <FormControl>
                <Text fontSize='xs' color='coolGray.600'>
                    {isGroup ? 'Add Participants' : 'Select recipient'}
                </Text>
                <Input
                    ref={inputRef}
                    key='profileSearchInput'
                    // autoFocus={true}
                    placeholder='Email, phone number, or username'
                    value={!maxSelected() ? queryString: ''}
                    onChangeText={handleQueryInput}
                    w='100%'
                    h='40px'
                    borderRadius='20px'
                    paddingX='20px'
                    marginRight='8px'
                    mt='4px'
                    autoCapitalize='none'
                    backgroundColor='#f1f1f1'
                    isFocused={searchSelected}
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
        <Button variant='ghost' bgColor='#f5f5f5' onPress={onSelect} w='100%' px='0' borderRadius='12px' my='4px'>
            <HStack px='0' w='100%' space={2}>
                <Image source={require('../../assets/profile-01.png')} 
                    style={{
                        width: 36,
                        height: 36,
                        margin: 'auto'
                    }}/>
                <Box>
                    <Text fontSize='md' fontWeight='bold' m='0'>
                        {profile.displayName}
                    </Text>
                    <Text fontSize='10px' fontWeight='light'>
                        {profile.handle}
                    </Text>
                </Box>
                <Spacer minWidth='42%' />
                <Box>
                    <Entypo name="plus" size={24} color="black" />
                </Box>
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
                    matchingProfiles.length > 0?
                    matchingProfiles.map((profile, index) => 
                        <Box key={index} w='100%'>
                            { profileSuggestion({
                                profile: profile,
                                onSelect: () => handleAddProfile(profile)
                            }) }
                        </Box>
                    )
                    :
                    <Text fontSize='xs' color='coolGray.600'>
                        No results found
                    </Text>
                }
                </Center>
            </Box>
            }
        </SearchContainer>
    </>;
}