import React, { useContext, useMemo, useCallback, useEffect } from "react";
import Test from "../../tests/test";
import { Box, Text, HStack, Spacer, Icon, FlatList, View, Pressable } from 'native-base';
import UIContext from "../../contexts/UIContext";
import colors from "../colors";
import { AntDesign } from "@expo/vector-icons";
import { useAppSelector } from "../../redux/hooks";
import { testSelector } from "../../redux/slices/testSlice";
import TestInstance from "../../tests/testInstance";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function TestList({
    selectTest
}: {
    selectTest: (test: Test | undefined) => void;
}): JSX.Element {
    const { theme } = useContext(UIContext);
    const { unitTests, integrationTests, instances } = useAppSelector(testSelector);

    useEffect(() => {
        console.log('test readout:');
        console.log(unitTests);
        console.log(instances);
    }, [instances]);

    const TestPreview = useCallback(({
        item
    }: {
        item: Test
    }): JSX.Element => {
        const numInstances = () => {
            if (item.id in instances) {
                return instances[item.id].length;
            }
            return 0;
        };

        const sucessfulInstances = () => {
            if (item.id in instances) {
                return instances[item.id].filter((inst: TestInstance) => inst.succeeded).length;
            }
            return 0;
        };

        return <TouchableOpacity onPress={() => selectTest(item)} style={{ width: '100%' }}>
            <Box bgColor={colors.message[theme]} borderRadius='24px' px='15px' py='12px' w='100%' my='6px'>
                <HStack>
                    <Box>
                        <Text fontSize='xs' color={colors.textLightNB[theme]}>
                            {item.id}
                        </Text>
                        <Text fontWeight='bold' color={colors.textMainNB[theme]}>
                            {item.name}
                        </Text>
                        <Text fontSize='xs' color={colors.textMainNB[theme]}>
                            {`${sucessfulInstances()}/${numInstances()} succeeded`}
                        </Text>
                    </Box>
                    <Spacer />
                    <Icon size='sm' color={colors.textMainNB[theme]} as={AntDesign} name='right' my='auto'/>
                </HStack>
            </Box>
        </TouchableOpacity>;
    }, [instances, theme]);

    return <View w='100%'>
        {
            Object.entries(unitTests).length > 0 &&
            <Text fontSize='xs' color={colors.textLightNB[theme]}>
                Unit tests:
            </Text>
        }
        <FlatList
            w='100%'
            data={Object.values(unitTests)}
            renderItem={TestPreview}
            keyExtractor={(item) => item.id}
            h={
                Object.entries(unitTests).length > 0 ?
                    Object.entries(integrationTests).length > 0 ? '50%' : '100%' :
                '0%'
            }
        />
        {
            Object.entries(integrationTests).length > 0 &&
            <Text fontSize='xs' color={colors.textLightNB[theme]}>
                Integration tests:
            </Text>
        }
        <FlatList
            data={Object.values(integrationTests)}
            renderItem={TestPreview}
            keyExtractor={(item) => item.id}
            h={
                Object.entries(integrationTests).length > 0 ? '50%' : '0%'
            }
        />
    </View>
}
