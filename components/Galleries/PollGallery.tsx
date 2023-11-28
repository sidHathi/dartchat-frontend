import React, { useContext } from "react";
import { View, Heading, Box, FlatList } from 'native-base';
import { Poll } from "../../types/types";
import PollDisplay from "../Polls/PollDisplay";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";
import colors from "../colors";
import UIContext from "../../contexts/UIContext";

export default function PollGallery(): JSX.Element {
    const { theme } = useContext(UIContext);
    const { currentConvo } = useAppSelector(chatSelector);

    const renderItem = ({item}: {item?: Poll}) => {
        if (!item) return null;
        return <Box w='100%' py='6px' px='24px'>
            <PollDisplay pid={item.id} />
        </Box>;
    }

    return <View flex='1'>
        <Heading px='24px' pt='24px' color={colors.textMainNB[theme]} fontSize='lg'>
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