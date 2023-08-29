import React, { useMemo, useCallback } from 'react';
import { UserProfile } from '../../types/types';
import { Box, HStack, VStack, Spacer, Text, Center, View, FlatList, Heading } from 'native-base';
import IconImage from '../generics/IconImage';
import IconButton from '../generics/IconButton';
import { AlphabetList, IData } from "react-native-section-alphabet-list";

export default function ContactsList({
    contacts,
    handleMessage
}: {
    contacts?: UserProfile[]
    handleMessage?: (profile: UserProfile) => void;
}): JSX.Element {
    const contactMap = useMemo(() => {
        if (!contacts) return {};
        return Object.fromEntries(
            contacts.map((c) => [c.id, c])
        );
    }, [contacts]);

    const data = useMemo(() => {
        if (!contacts) return [];
        // TO-DO: need to enforce non-numeric characters in display names
        return contacts
            .sort((c1, c2) => c1.displayName.localeCompare(c2.displayName));
    }, [contacts]);

    const getContactAvatarElem = (contact: UserProfile) => {
        if (contact.avatar) {
            return <IconImage imageUri={contact.avatar.tinyUri} size={36} />;
        }
        return <IconButton label='profile' size={36} />;
    }

    const renderItem = useCallback(({item, index}: {item: UserProfile, index: number}) => {
        const isAlpha = index == 0 || (item.displayName.charAt(0) !== data[index - 1].displayName.charAt(0));

        return <View>
            {
            isAlpha && <Heading fontSize='md' px='18px' pb='3px' pt='12px' color='gray.500'>
                {item.displayName.charAt(0).toLocaleUpperCase()}
            </Heading>
            }
            <Box borderRadius='24px' bgColor={
            index % 2 === 0 ? '#f5f5f5' : 'transparent'} mx='12px'>
                <HStack pl='12px' pr='6px' space={3} py='9px'>
                    {getContactAvatarElem(item)}
                    <VStack>
                        <Spacer />
                        <Text fontSize='sm' fontWeight='bold'>
                            {item.displayName}
                        </Text>
                        <Text fontSize='9px' color='gray.500'>
                            {item.handle}
                        </Text>
                        <Spacer />
                    </VStack>
                <Spacer />
                <Center>
                    <Box borderRadius='24px' shadow='9' bgColor='#222' p='6px' style={{
                        shadowOpacity: 0.12
                    }} mx='6px'>
                        <IconButton label='message' color='white' size={20} 
                            onPress={() => (handleMessage && handleMessage(item))}/>
                    </Box>
                </Center>
                </HStack>
            </Box>
        </View>
    }, [contactMap]);

    const list = useMemo(() => {
        try {
            return <FlatList
                data={data}
                renderItem={renderItem}
            />
        } catch (err) {
            console.log(err);
            return <></>;
        }
    }, [data]);

    return (contacts && data.length > 0) ?  list : <></>;
    // return <></>;
}