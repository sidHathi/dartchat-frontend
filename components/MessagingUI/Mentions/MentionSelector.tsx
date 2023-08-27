import React, {useContext, useEffect, useMemo} from "react";
import { Box, HStack, ScrollView, Spacer, Text, VStack } from 'native-base';
import IconImage from "../../generics/IconImage";
import { UserConversationProfile } from "../../../types/types";
import IconButton from "../../generics/IconButton";
import { TouchableOpacity } from "react-native-gesture-handler";
import MentionSuggestionContext from "../../../contexts/MentionSuggestionContext";

export default function MentionSelector({
    profileMatches,
    onSelect
}: {
    profileMatches: UserConversationProfile[],
    onSelect: (profile: UserConversationProfile) => void;
}) : JSX.Element {
    const { setShowingSuggestions } = useContext(MentionSuggestionContext);

    useEffect(() => {
        if (profileMatches.length > 0) {
            setShowingSuggestions(true);
        } else {
            setShowingSuggestions(false);
        }
    }, [profileMatches]);

    const MenuItem = ({profile}: {profile: UserConversationProfile}) => {
        const avatarImage = () => {
            if (profile.avatar) {
                return <IconImage imageUri={profile.avatar.tinyUri} size={24} />;
            }
            return <IconButton size={24} label='profile' shadow='9' />;
        }

        return <TouchableOpacity onPress={() => onSelect(profile)}
            style={{
                width: '100%'
            }}>
            <Box w='100%' bgColor='#f5f5f5' mx='12px' py='6px'
                borderBottomColor='#ddd' borderBottomWidth='1px'>
                <HStack space={2}>
                    <VStack>
                        <Spacer />
                        {avatarImage()}
                        <Spacer />
                    </VStack>
                    <VStack>
                        <Spacer />
                        <Text fontSize='sm' m='0px' fontWeight='bold' p='0px'>{profile.displayName}</Text>
                        {profile.handle && 
                        <Text fontSize='xs' mt='-2px' p='0px' color='gray.500'>{profile.handle}</Text>
                        }
                        <Spacer />
                    </VStack>
                </HStack>
            </Box>
        </TouchableOpacity>
    }

    if (profileMatches.length < 1) return <></>;

    return <Box w='100%' borderTopLeftRadius='24px' borderTopRightRadius='24px' overflow='hidden' pt='6px' bgColor='#f5f5f5'>
        <ScrollView maxHeight='180px'>
            <VStack>
            {
                profileMatches.map((profile) => <MenuItem profile={profile} key={profile.id} />)
            }
            </VStack>
        </ScrollView>
    </Box>
}
