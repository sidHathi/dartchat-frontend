import React from 'react';
import { View, Box, Text, Heading, HStack, Spacer } from 'native-base';
import { Dimensions } from 'react-native';
import IconButton from '../generics/IconButton';
import { ScrollViewPropertiesAndroid } from 'react-native';
import { logOut } from '../../firebase/auth';

export default function MessagingContainer({exit}: {exit: () => void}): JSX.Element {
    const screenHeight = Dimensions.get('window').height;

    return <View w='100%' h={screenHeight} backgroundColor='#222'>
        <Box backgroundColor='#fefefe' h='90px' overflow='hidden' zIndex='1001'>
            <Box backgroundColor='#222' borderBottomRightRadius='24px' h='90px' zIndex='999'>
                <HStack paddingTop='50px' marginX='6px'>
                    <IconButton label='back' size={24} additionalProps={{marginX: '4px', paddingTop: '5px'}} onPress={exit}/>
                    <Heading fontSize='md' color='white' paddingTop='8px'>
                        Firstname Lastname
                    </Heading>
                    <Spacer />
                    <IconButton label='settings' size={24} additionalProps={{marginX: '6px', paddingTop: '5px'}}/>
                    <IconButton label='profile' size={33} additionalProps={{marginX: '6px'}} onPress={logOut}/>
                </HStack>
            </Box>
        </Box>
        <Box w='100%' h={`${screenHeight - 90} px`} backgroundColor='#fefefe' borderTopLeftRadius='24px' shadow='9' zIndex='1000'>
            <></>
        </Box>
    </View>
}