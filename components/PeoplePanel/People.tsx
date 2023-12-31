import React, { useState, useMemo } from "react";
import { View, Box, Heading } from 'native-base'
import SpacedTabs from "../generics/SpacedTabs";
import ContactsView from "./ContactsView";
import ArchivedChats from "./ArchivedChats";

type Panel = 'Contacts' | 'Archived groups'

export default function People(): JSX.Element {
    const [selectedPanel, setSelectedPanel] = useState<Panel>('Contacts');

    const mainElem = useMemo(() => {
        switch (selectedPanel) {
            case 'Contacts':
                return <ContactsView />;
            case "Archived groups":
                return <ArchivedChats />;
            default:
                return <></>
        }
    }, [selectedPanel]);

    return <View flex='1'>
        <Heading pt='24px' px='24px'>People and groups</Heading>
        <Box my='12px' px='12px'>
            <SpacedTabs
                options={[
                    'Contacts',
                    'Archived groups'
                ]}
                selectedOption={selectedPanel as string}
                setSelectedOption={(newVal: string) => {
                    if (['Contacts', 'Archived groups'].includes(newVal)) {
                        setSelectedPanel(newVal as Panel);
                    }
                }} 
            />
        </Box>
        <View flex='1'>
        {
            mainElem
        }
        </View>
    </View>
}