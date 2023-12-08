import React, { useContext } from 'react';
import Log from '../../tests/log';
import { Box, HStack, Spacer, Text, VStack } from 'native-base';
import colors from '../colors';
import UIContext from '../../contexts/UIContext';

export default function ILogCard({
    log
}: {
    log: Log
}): JSX.Element {
    const { theme } = useContext(UIContext);

    const TypeAnnotation = ({
        text,
        colorOverride
    }: {
        text: string;
        colorOverride?: string;
    }) => (
        <Box py='3px' px='6px' bgColor={colors.bgLight[theme]} borderRadius='6px' mb='3px'>
            <Text fontSize='10px' color={colorOverride || colors.textMainNB[theme]} textTransform='capitalize' m='auto'>
                {text}
            </Text>
        </Box>
    );

    return <Box p='6px' w='100%'>
        <VStack>
            <HStack space='2'>
                <TypeAnnotation text={log.type} />
                {
                    log.encrypted &&
                    (
                        log.encryptionFailure ?
                            <TypeAnnotation text='Encrypted' /> :
                            <TypeAnnotation text='Encrypted' colorOverride='red.500' />
                    )
                }
                {
                    log.error &&
                    <TypeAnnotation text='Error' colorOverride='red.500' />
                }
            </HStack>
            <Text fontSize='xs' color={colors.textLightNB[theme]}>
                {log.timestamp.toLocaleString()}
            </Text>
            
            {
                log.textPreview &&
                <Text fontSize='xs' color={colors.textMainNB[theme]}>
                    {log.textPreview}
                </Text>
            }
            {
                log.error &&
                <Box bgColor={colors.bgLight[theme]} p='3px' borderRadius='3px'>
                    <Text fontSize='sm' color='red.500'>
                        {log.error}
                    </Text>
                </Box>
            }
        </VStack>
    </Box>;
}
