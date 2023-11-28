import React, { useContext, useState } from 'react';
import { View, Box, Button, Heading, Text, HStack, Spacer } from 'native-base';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import ConversationProfileDisplay from './ConversationProfileDisplay';
import ConversationProfileEditor from './ConversationProfileEditor';
import IconButton from '../generics/IconButton';
import colors from '../colors';
import UIContext from '../../contexts/UIContext';

export default function ConversationProfileManager({
    exit
}: {
    exit?: () => void;
}): JSX.Element {
    const { theme } = useContext(UIContext);
    const [editing, setEditing] = useState(false);

    return <View w='100%'>
        <Box w='96%' mx='auto' my='6px' borderRadius='24px' shadow='9' style={{
            shadowOpacity: 0.1
        }} p='24px' bgColor={colors.solid[theme]}>
            <HStack space={2} zIndex='1000'>
                <Spacer />
                <TouchableOpacity onPress={() => setEditing(!editing)}>
                    {
                        editing ? 
                        <HStack space={2}>
                            <MaterialIcons name="cancel" size={22} color={colors.textMainNB[theme]} />
                            <Text fontWeight='bold' color={colors.textMainNB[theme]}>Cancel</Text>
                        </HStack> :
                        <HStack space={2}>
                            <Feather name="edit-3" size={24} color={colors.textMainNB[theme]} />
                            <Text fontWeight='bold' color={colors.textMainNB[theme]}>Edit</Text>
                        </HStack>
                    }
                </TouchableOpacity>
            </HStack>
            <Box py='6px' mt={editing ? '0px' : '-24px'} w='100%' zIndex='999'>
            {
                editing ?
                <ConversationProfileEditor handleSave={() => setEditing(false)}/> :
                <ConversationProfileDisplay />
            }
            </Box>
        </Box>
    </View>
}