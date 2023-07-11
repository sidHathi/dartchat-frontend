import React, { useContext } from 'react';
import { Box, HStack, VStack, View, Center, Text, Heading, Spacer, Button } from 'native-base';
import { Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import IconButton from '../generics/IconButton';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import { AntDesign } from '@expo/vector-icons';
import ProfileImage from '../generics/ProfileImage';

export default function ProfileDisplay({
    handleExit,
    toggleEditMode
}: {
    handleExit: () => void;
    toggleEditMode: () => void;
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const { user, logOut } = useContext(AuthIdentityContext);

    const handleShare = () => {};
    
    return <View flex='1'>
        <Center width='100%' mt='12px'>
            <HStack w='100%' px='24px' py='12px'>
                <TouchableOpacity onPress={handleExit}>
                    <HStack space={2}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                        <Text fontWeight='bold'>Back</Text>
                    </HStack>
                </TouchableOpacity>
                <Spacer />
                <TouchableOpacity onPress={toggleEditMode}>
                    <HStack space={2}>
                        <Feather name="edit-3" size={24} color="black" />
                        <Text fontWeight='bold'>Edit</Text>
                    </HStack>
                </TouchableOpacity>
            </HStack>
            <Box bgColor='#f5f5f5' p='24px' borderRadius='24px' mx='auto' w='90%' shadow='9' style={{shadowOpacity: 0.07}}>
                <HStack space={6} px='40px'>
                    {
                        user?.avatar?.mainUri ?
                        <ProfileImage imageUri={user?.avatar?.mainUri} size={80} shadow='9' /> :
                        <IconButton label='profile' size={80} />
                    }
                    <VStack h='100%'>
                        <Spacer />
                        <Heading>
                            { user && (user.displayName || user.handle || user.email) }
                        </Heading>
                        <Text fontSize='xs'>
                            { user && (user.handle || user.email) }
                        </Text>
                        <Spacer />
                    </VStack>
                </HStack>
            </Box>
            <TouchableOpacity onPress={handleShare} style={{width: screenWidth * 0.8}}>
                <Box h='36px' mt='-18px' borderRadius='24px' mx='auto' bgColor='white' shadow='9' style={{shadowOpacity: 0.1}} w='70%'>
                    <Center flex='1'>
                    <HStack w='100%' space={2}>
                        <Spacer />
                        <AntDesign name="sharealt" size={20} color="black" />
                        <Text fontWeight='bold'>Share</Text>
                        <Spacer />
                    </HStack>
                    </Center>
                </Box>
            </TouchableOpacity>
            <Box bgColor='#f5f5f5' p='24px' borderRadius='24px' mx='auto' w='90%' mt='24px' shadow='9' style={{shadowOpacity: 0.07}}>
                <Center borderTopColor='#aaa' w='100%'>
                    <Button variant='subtle' colorScheme='dark' borderRadius='24px' onPress={logOut} w='100%'>
                        <Text color='white' fontWeight='bold'>
                            Log out
                        </Text>
                    </Button>
                </Center>
            </Box>
        </Center>
    </View>
}