import React, { useEffect } from 'react';
import { PreviewData } from "@flyerhq/react-native-link-preview";
import { Box, Text, VStack } from 'native-base';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function LinkPreview({
    data,
    width,
    aspect
}: {
    data?: PreviewData,
    width: number,
    aspect: number
}): JSX.Element {
    if (!data || !data.image) {
        return <></>;
    }

    useEffect(() => {
        console.log('preview data:')
        console.log(data)
    }, [data])

    return <TouchableOpacity><Box w='120%' borderRadius='12px' bgColor='#f5f5f5' my='12px' overflow='hidden' ml={'-3%'}>
        <VStack w='100%' overflow='hidden'>
        {data.image &&
            <FastImage
                source={{
                    uri: data.image.url,
                    priority: 'low'
                }}
                style={{
                    margin: 3,
                    width: (1.2*width) - 6,
                    height: ((1.2*width) - 6)/aspect,
                    borderRadius: 12,
                    borderBottomLeftRadius: 6,
                    borderBottomRightRadius: 6
                }}
            />
        }
        <Box w='100%'>
            <Text fontWeight='medium' fontSize='11px' mt='12px' mb='3px' mx='18px' maxW='85%'>
                {data.title}
            </Text>
            <Text color='gray.500' fontSize='10px' mx='18px' mb='12px'>
                {data.link}
            </Text>
        </Box>
        </VStack>
    </Box></TouchableOpacity>
}