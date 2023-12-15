import React, { useCallback, useContext, useState, useEffect } from 'react';
import { View, Box, Heading, VStack } from 'native-base'
import colors from '../colors';
import UIContext from '../../contexts/UIContext';
import ConnectionDashboard from './ConnectionDashboard';
import SpacedTabs from '../generics/SpacedTabs';
import TestList from './TestList';
import ILogs from './ILogs';
import Test from '../../tests/test';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { initTestStore, initTests, testSelector } from '../../redux/slices/testSlice';
import testStore from '../../localStore/testStore';
import TestDetails from './TestDetails/TestDetails';
import UnitTests from '../../tests/UnitTests';
import IntegrationTests from '../../tests/IntegrationTests';

export default function TestingController(): JSX.Element {
    const { theme } = useContext(UIContext);
    const dispatch = useAppDispatch();
    const { unitTests, integrationTests, recentLogs, instances } = useAppSelector(testSelector);

    const [currentTab, setCurrentTab] = useState<'tests' | 'logs'>('tests');
    const [testDetailViewOpen, setTestDetailViewOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<Test | undefined>();

    const selectTest = useCallback((test: Test | undefined) => {
        if (test) {
            setTestDetailViewOpen(true);
        } else {
            setTestDetailViewOpen(false);
        }

        setSelectedTest(test);
    }, [setSelectedTest, setTestDetailViewOpen]);

    useEffect(() => {
        // needs to:
        // 1. pull the instance list from storage
        // 2. pull the test list from the code file
        // 4. pull the log list from storage
        // 3. put both into redux 
        const pullLocalTests = async () => {
            const codedUnitTests = UnitTests;
            const codedIntegrationTests = IntegrationTests;
            const snapshot = await testStore.getTestSnapshot() as any;
            console.log(snapshot);
            if (snapshot && Object.keys(snapshot).length > 1) {
                dispatch(initTestStore({
                    ...snapshot,
                    codedTests: {
                        unitTests: codedUnitTests,
                        integrationTests: codedIntegrationTests
                    }
                }));
            } else {
                dispatch(
                    initTests({
                        unitTests: codedUnitTests,
                        integrationTests: codedIntegrationTests
                    })
                )
            }
        }
        pullLocalTests();
    }, []);

    useEffect(() => {
        if (recentLogs.length < 1 || Object.keys(instances).length < 1) {
            return;
        }
        const storeSnapshot = async () => {
            await testStore.storeLogSnapshot({
                unitTests,
                integrationTests,
                instances,
                recentLogs
            })
        };
        storeSnapshot();
    }, [recentLogs, instances, unitTests, integrationTests]);

    if (testDetailViewOpen && selectedTest) {
        return <TestDetails 
            test={selectedTest} 
            exit={() => {
                setSelectedTest(undefined);
                setTestDetailViewOpen(false);
            }}/>;
    }

    return <View flex='1' bgColor={colors.bgLight[theme]} p='12px'>
        <VStack space='4'>
            <ConnectionDashboard />
            <SpacedTabs
                options={['tests', 'logs']}
                selectedOption={currentTab}
                setSelectedOption={setCurrentTab as (newVal: string) => void}
            />
            {
                currentTab === 'tests' ?
                    <TestList selectTest={selectTest} /> : 
                    <ILogs />
            }
        </VStack>
    </View>;
}