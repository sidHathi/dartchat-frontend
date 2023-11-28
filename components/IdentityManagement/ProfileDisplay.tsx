import React, { useCallback, useContext } from 'react';
import { Box, HStack, VStack, View, Center, Text, Heading, Spacer, Button, Icon, ScrollView } from 'native-base';
import { Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import IconButton from '../generics/IconButton';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import { AntDesign } from '@expo/vector-icons';
import IconImage from '../generics/IconImage';
import UIContext from '../../contexts/UIContext';
import { useAppDispatch } from '../../redux/hooks';
import { setUiTheme } from '../../redux/slices/userDataSlice';
import localStore from '../../localStore/localStore';
import colors from '../colors';

export default function ProfileDisplay({
    handleExit,
    toggleEditMode
}: {
    handleExit: () => void;
    toggleEditMode: () => void;
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const { user, logOut } = useContext(AuthIdentityContext);
    const { theme } = useContext(UIContext);
    const dispatch = useAppDispatch();

    const handleShare = () => {};

    const setTheme = useCallback(async (newTheme: 'light' | 'dark') => {
        dispatch(setUiTheme(newTheme));
        await localStore.setNewColorTheme(newTheme);
    }, [theme]);
    
    return <View flex='1'>
        <Center width='100%' mt='12px'>
            <HStack w='100%' px='24px' py='12px'>
                <TouchableOpacity onPress={handleExit}>
                    <HStack space={2}>
                        <Ionicons name="arrow-back" size={24} color={colors.textMainNB[theme]} />
                        <Text fontWeight='bold' color={colors.textMainNB[theme]}>Back</Text>
                    </HStack>
                </TouchableOpacity>
                <Spacer />
                {/* <TouchableOpacity onPress={toggleEditMode}>
                    <HStack space={2}>
                        <Feather name="edit-3" size={24} color="black" />
                        <Text fontWeight='bold'>Edit</Text>
                    </HStack>
                </TouchableOpacity> */}
            </HStack>
            <ScrollView w='100%'>
            <Box bgColor={colors.card[theme]} p='24px' borderRadius='24px' mx='auto' w='90%' shadow='9' style={{shadowOpacity: 0.07}} overflow='hidden'>
                <HStack space={6} px='12px'>
                    {
                        user?.avatar?.mainUri ?
                        <IconImage imageUri={user?.avatar?.mainUri} size={80} shadow='9' /> :
                        <IconButton label='profile' size={80} shadow='9' />
                    }
                    <VStack h='100%'>
                        <Spacer />
                        <Heading maxWidth='200px' maxH='100px' fontSize='lg' color={colors.textMainNB[theme]}>
                            { user && (user.displayName || user.handle || user.email) }
                        </Heading>
                        <Text fontSize='xs' color={colors.textMainNB[theme]}>
                            { user && (user.handle || user.email) }
                        </Text>
                        <Spacer />
                    </VStack>
                    <Spacer />
                </HStack>
                <VStack space={3} px='12px' mt='24px'>
                    <Heading fontSize='md' color={colors.textMainNB[theme]}>
                        Contact details
                    </Heading>
                    {user?.email &&
                    <Box>
                        <Text fontWeight='bold' fontSize='xs' color={colors.textLightNB[theme]}>
                            Email
                        </Text>
                        <Text fontSize='sm' color={colors.textMainNB[theme]}>
                            {user?.email}
                        </Text>
                    </Box>
                    }
                    {user?.phone &&
                    <Box>
                        <Text fontWeight='bold' color={colors.textLightNB[theme]} fontSize='xs'>
                            Phone
                        </Text>
                        <Text fontSize='sm' color={colors.textMainNB[theme]}>
                            {user?.phone}
                        </Text>
                    </Box>
                    }
                </VStack>
                <HStack w='100%' pb='12px'>
                    <Spacer />
                    <TouchableOpacity onPress={toggleEditMode}>
                        <Box borderRadius='full' py='6px' px='12px' bgColor='#ddd'>
                            <HStack space={2}>
                                <Feather name="edit-3" size={24} color="black" />
                                <Text fontWeight='bold'>Edit</Text>
                            </HStack>
                        </Box>
                    </TouchableOpacity>
                </HStack>
            </Box>
            <TouchableOpacity onPress={handleShare} style={{width: screenWidth * 1}}>
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
            <Box bgColor={colors.card[theme]} p='24px' borderRadius='24px' mx='auto' w='90%' shadow='9' style={{shadowOpacity: 0.07}} overflow='hidden'
            mt='24px'>
                <Heading fontSize='md' pb='12px' color={colors.textMainNB[theme]}>
                    Preferences
                </Heading>
                <Text fontWeight='bold' color='gray.500' fontSize='xs'>
                    Color Theme
                </Text>
                <Button.Group isAttached borderRadius='24px' w='100%' mt='12px'>
                    <Button colorScheme='dark' w='50%' variant={theme === 'light' ? 'subtle' : 'ghost'}
                    leftIcon={<Icon as={Entypo} name="light-up" size="sm" />} onPress={() => setTheme('light')}>
                        light
                    </Button>
                    <Button colorScheme='dark' w='50%'  variant={theme === 'dark' ? 'subtle' : 'solid'}
                    leftIcon={<Icon as={Entypo} name="moon" size="sm" />} onPress={() => setTheme('dark')}>
                        dark
                    </Button>
                </Button.Group>
            </Box>
            <Box bgColor={colors.card[theme]} p='24px' borderRadius='24px' mx='auto' w='90%' mt='24px' shadow='9' style={{shadowOpacity: 0.07}}>
                <Center borderTopColor='#aaa' w='100%'>
                    <Button variant='subtle' colorScheme='dark' borderRadius='24px' onPress={logOut} w='100%'>
                        <Text color='white' fontWeight='bold'>
                            Log out
                        </Text>
                    </Button>
                </Center>
            </Box>
            </ScrollView>
        </Center>
    </View>
}