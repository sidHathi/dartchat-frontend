import { Alert, HStack, Text } from "native-base";
import React from "react";

export default function NetworkDisconnectionAlert({type}: {
    type?: 'network' | 'server'
}): JSX.Element {
    return <Alert borderRadius='24px' status='error' variant='subtle'
    p='12px' mx='12px' maxHeight='100px' overflow='hidden'>
        <HStack space={4} flexShrink={1} alignItems="center" maxWidth='90%'>
            <Alert.Icon />
            <Text color='red.800' fontSize='xs' maxWidth='90%'>
                {
                    type === 'network' ?
                    "Your device is not connected to the internet. You will not be able to send, receive, or view messages until you reconnect." :
                    "Unable to connect to the DartChat server. Messaging is temporarily unavailable."
                }
            </Text>
        </HStack>
    </Alert>
}
