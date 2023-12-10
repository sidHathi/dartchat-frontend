import React, { useContext } from "react";
import { useAppSelector } from "../../redux/hooks";
import { testSelector } from "../../redux/slices/testSlice";
import Log from "../../tests/log";
import ILogCard from "./ILogCard";
import { Box, Text, Center, FlatList } from 'native-base';
import UIContext from "../../contexts/UIContext";
import colors from "../colors";

export default function ILogs(): JSX.Element {
    const { theme } = useContext(UIContext);
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
                bgColor={colors.card[theme]}
                py='12px'
                px='15px'
                borderRadius='24px'
                data={[...recentLogs].sort((a, b) => {
                    if (a.timestamp.getTime() > b.timestamp.getTime()) return -1;
                    else if (b.timestamp.getTime() > a.timestamp.getTime()) return 1;
                    return 0;
                })}
                renderItem={renderLog}
                maxH='420px'
                ListFooterComponent={<Box h='40px' />}
            /> :
            <Center h='100%'>
                <Text>
                    No recent logs
                </Text>
            </Center>
    );
}
