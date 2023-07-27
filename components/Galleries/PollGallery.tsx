import React from "react";
import { View, Heading, Box, FlatList } from 'native-base';
import { Poll } from "../../types/types";
import PollDisplay from "../Polls/PollDisplay";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";

export default function PollGallery(): JSX.Element {
    const { currentConvo } = useAppSelector(chatSelector);

    const renderItem = ({item}: {item?: Poll}) => {
        if (!item) return null;
        return <Box w='100%' py='6px' px='24px'>
            <PollDisplay pid={item.id} />
        </Box>;
    }

    return <View flex='1'>
        <Heading px='24px' pt='24px'>
            Polls
        </Heading>
        <FlatList 
            flex='1'
            data={currentConvo?.polls || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<Box h='12px' />}
            ListFooterComponent={<Box h='48px' />}
            />
    </View>
}