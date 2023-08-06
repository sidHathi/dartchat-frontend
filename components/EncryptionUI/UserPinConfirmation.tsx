import React from "react";
import { View, Box, Heading, Text, Center, Button, HStack } from 'native-base';
import Spinner from "react-native-spinkit";
import { TouchableOpacity } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";

export default function UserPinConfirmation({
    selectedPin,
    onConfirm,
    onReject,
    validationLoading
}: {
    selectedPin: string;
    onConfirm: () => void;
    onReject: () => void;
    validationLoading: boolean;
}): JSX.Element {
    return <View flex='1' bgColor='#fefefe'>
        <Box w='90%' m='auto' p='24px' bgColor='#f5f5f5' shadow='9' borderRadius='24px'>
            <TouchableOpacity onPress={onReject}>
                <HStack space={2}>
                <MaterialIcons name="cancel" size={22} color="black" />
                <Text fontWeight='bold'>Cancel</Text>
                </HStack>
            </TouchableOpacity>
            <Center my='12px'>
                <Heading fontSize='3xl' my='48px'>
                    {selectedPin}
                </Heading>
                <Text color='gray.500' mb='12px' textAlign='center'>
                    This is your PIN. If you switch devices or log out of DartChat you will not be able to access your encrypted conversations without this PIN. <Text fontWeight='bold'>
                        There is no way to recover your PIN if you forget it.
                    </Text>
                </Text>

                {
                    validationLoading &&
                    <Center w='100%'>
                        <Spinner type='ThreeBounce' />
                    </Center>
                }
                <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' mt='12px' onPress={onConfirm}>
                    Confirm PIN
                </Button>
            </Center>
        </Box>
    </View>
}
