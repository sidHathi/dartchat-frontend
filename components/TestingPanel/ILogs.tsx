import React from "react";
import { useAppSelector } from "../../redux/hooks";
import { testSelector } from "../../redux/slices/testSlice";
import Log from "../../tests/log";
import ILogCard from "./ILogCard";
import { View, Text, Center, FlatList } from 'native-base';

export default function ILogs(): JSX.Element {
    const { recentLogs } = useAppSelector(testSelector);

    const renderLog = ({
        item
    }: {
        item: Log
    }) => {
        return <ILogCard log={item} />;
    };

    return (
        recentLogs.length > 0 ?
            <FlatList
                data={recentLogs}
                renderItem={renderLog}
            /> :
            <Center h='100%'>
                <Text>
                    No recent logs
                </Text>
            </Center>
    );
}
