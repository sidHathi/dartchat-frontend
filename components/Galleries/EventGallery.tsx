import React, { useState } from "react";
import { View, Heading, Box, FlatList, Pressable } from 'native-base';
import { CalendarEvent } from "../../types/types";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";
import EventDisplay from "../EventsUI/EventDisplay";

export default function EventGallery(): JSX.Element {
    const { currentConvo } = useAppSelector(chatSelector);

    const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

    const handleSelect = (id: string) => {
        if (selectedEventId) {
            setSelectedEventId(undefined);
            return;
        }
        setSelectedEventId(id);
    };

    const renderItem = ({item}: {item?: CalendarEvent}) => {
        if (!item) return null;
        return <Pressable w='100%' onPress={() => handleSelect(item.id)}>
            <Box w='100%' py='6px' px='24px'>
                <EventDisplay eid={item.id} selected={
                    selectedEventId === item.id
                } />
            </Box>
        </Pressable>;
    };

    return <View flex='1'>
        <Heading px='24px' pt='24px'>
            Events
        </Heading>
        <FlatList 
            flex='1'
            data={currentConvo?.events || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<Box h='12px' />}
            ListFooterComponent={<Box h='48px' />}
            />
    </View>
}