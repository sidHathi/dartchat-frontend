import React, { useContext, useMemo, useCallback, useState } from "react";
import { Box, FlatList, Text, Center } from 'native-base';
import colors from "../../colors";
import UIContext from "../../../contexts/UIContext";
import { useAppSelector } from "../../../redux/hooks";
import { testSelector } from "../../../redux/slices/testSlice";
import Log from "../../../tests/log";
import ILogCard from "../ILogCard";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function LogPanel({
    testId
}: {
    testId: string
}): JSX.Element {
    const { theme } = useContext(UIContext);
    const { instances } = useAppSelector(testSelector);

    const [expanded, setExpanded] = useState(false);

    const ExpandButton = useCallback(() => {
        return <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text fontSize='xs' color={colors.textMainNB[theme]} fontWeight='bold'>
                {expanded ? 'Collapse' : 'Expand'}
            </Text>
        </TouchableOpacity>
    }, [expanded])

    const logs = useMemo(() => {
        if (!(testId in instances)) return [];
        return instances[testId].reduce<Log[]>((acc, curr) => {
            return [...acc, ...curr.logs]
        }, [])
    }, [instances, testId]);

    if (logs.length < 1) return <></>;

    return <Box bgColor={colors.card[theme]} px='15px' py='12px' borderRadius='24px'>
        <FlatList
            maxHeight={expanded ? 'auto' : '300px'}
            data={logs}
            scrollEnabled={false}
            renderItem={({item}) => <ILogCard log={item} />}
            ListFooterComponent={<Box h='12px' />}
        />
        <Center mt='12px'>
            <ExpandButton />
        </Center>
    </Box>
}
