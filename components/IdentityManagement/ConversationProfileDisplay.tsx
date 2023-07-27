import React, { useContext } from "react";
import { Box, HStack, Spacer, Heading, VStack, Text } from 'native-base';

import IconImage from "../generics/IconImage";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import IconButton from "../generics/IconButton";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";

export default function ConversationProfileDisplay(): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    
    const getAvatar = () => {
        if (!user || !currentConvo) {
            return <IconButton label='profile' size={72} shadow='9' />
        }
        const matchingProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingProfiles.length < 1 || !matchingProfiles[0].avatar) {
            return <IconButton label='profile' size={72} shadow='9' />
        }
        return <IconImage imageUri={matchingProfiles[0].avatar.tinyUri} size={64} shadow='9' />
    };

    const getDisplayName = () => {
        if (!user || !currentConvo) return 'Anon';
        const matchingProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingProfiles.length > 0) {
            return matchingProfiles[0].displayName;
        }
        return 'Anon';
    }

    return <Box>
        <HStack space={6} mt='6px'>
            {getAvatar()}
            <VStack flex='1'>
                <Spacer />
                <Heading fontSize='lg'>
                    {getDisplayName()}
                </Heading>
                <Text fontSize='xs'>
                    { user && (user.handle || user.email) }
                </Text>
                <Spacer />
            </VStack>
        </HStack>
    </Box>;
}
