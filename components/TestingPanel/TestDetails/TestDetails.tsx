import React, { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { Spacer, Heading, HStack, View, VStack, Box, Center, Text, ScrollView } from 'native-base';
import Test from "../../../tests/test";
import UIContext from "../../../contexts/UIContext";
import colors from "../../colors";
import InstanceList from "./InstanceList";
import LogPanel from "./LogPanel";
import IconButton from "../../generics/IconButton";
import UIButton from "../../generics/UIButton";
import UserSecretsContext from "../../../contexts/UserSecretsContext";
import TestInstance from "../../../tests/testInstance";
import uuid from 'react-native-uuid';
import AuthIdentityContext from "../../../contexts/AuthIdentityContext";
import { recordTestInstance, testSelector, updateTestInstance } from "../../../redux/slices/testSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import Spinner from "react-native-spinkit";

export default function TestDetails({
    test,
    exit
}: {
    test: Test;
    exit: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { theme } = useContext(UIContext);
    const { user } = useContext(AuthIdentityContext);
    const { handleNewConversationKey, forgetConversationKeys } = useContext(UserSecretsContext);
    const { instances } = useAppSelector(testSelector);

    const [runtimeError, setRuntimeError] = useState<string | undefined>();
    const [testRunning, setTestRunning] = useState(false);

    const testParams = useMemo(() => {
        return {
            user,
            secretsHandler: handleNewConversationKey,
            forgetConversationKeys: forgetConversationKeys,
        };
    }, [handleNewConversationKey, forgetConversationKeys, user]);

    useEffect(() => {
        console.log(instances);
    }, [instances])

    const runTest = useCallback(async () => {
        // store the test in state as current test
        // create a new instance for the test
        // add the instance to the redux store
        // pass in whatever params are needed for the test to run??
        // store the logs for the test as they come up???
        // display any errors and the final result
        if (!test) return;
        test.init(testParams);
        setRuntimeError(undefined);
        const instanceId = uuid.v4().toString();
        const testInstance : TestInstance = {
            testId: test.id,
            startedAt: new Date(),
            completedAt: undefined,
            id: instanceId,
            status: 'running',
            logs: [],
            succeeded: false,
            complete: false,
        }
        setTestRunning(true);
        try {
            dispatch(recordTestInstance(testInstance));
            await test.run();
            dispatch(updateTestInstance({
                testId: test.id,
                instanceId,
                updatedInstance: {
                    ...testInstance,
                    completedAt: new Date(),
                    logs: test.logs,
                    succeeded: test.errors.length === 0,
                    complete: true
                }
            }));
            console.log(test);
            setTestRunning(false);
        } catch (err) {
            console.log('TEST ERROR');
            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            setRuntimeError(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            dispatch(updateTestInstance({
                testId: test.id,
                instanceId,
                updatedInstance: {
                    ...testInstance,
                    completedAt: new Date(),
                    logs: test.logs,
                    succeeded: false,
                    complete: true
                }
            }));
            setTestRunning(false);
            console.log(err);
        }
    }, [test, testParams])
    
    return <ScrollView flex='1' p='12px'>
        <VStack space='2'>
            <HStack space='2' mb='12px'>
                <Box my='auto'>
                    <IconButton label='back' size={18} onPress={exit} color={colors.textMainNB[theme]} />
                </Box>
                <Heading color={colors.textMainNB[theme]} fontSize='lg'>
                    {test.name}
                </Heading>
                <Spacer />
            </HStack>
            <InstanceList testId={test.id} />
            <LogPanel testId={test.id} />
            <Spacer />
            {
                runtimeError &&
                <Box w='100%' py='12px' px='15px' borderRadius='24px' bgColor={colors.card[theme]} mb='6px'>
                    <Text fontSize='xs' color={colors.textLightNB[theme]}fontWeight='bold' textTransform='uppercase'>Error details</Text>
                    <Text color={colors.textMainNB[theme]} numberOfLines={10}>{runtimeError}</Text>
                </Box>
            }
            {
                testRunning &&
                <Center w='100%'>
                    <Spinner color={colors.textMainNB[theme]} type="ThreeBounce"/>
                </Center>
            }
            <UIButton context='primary' w='100%' borderRadius='full' onPress={runTest} mb='100px'>
                Run
            </UIButton>
        </VStack>
    </ScrollView>
}
