import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, Center, Modal, VStack, Text, Select, CheckIcon } from "native-base";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { chatSelector, pullConversation, setCCPublicKey, updatePrivUsersForNewKey } from "../../../redux/slices/chatSlice";
import reencryptor, { Reencryptor } from "../../../utils/reencryptor";
import useRequest from "../../../requests/useRequest";
import UserSecretsContext from "../../../contexts/UserSecretsContext";
import { encodeKey, genKeyPair } from "../../../utils/encryptionUtils";
import SocketContext from "../../../contexts/SocketContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Spinner from "react-native-spinkit";
import colors from "../../colors";
import UIContext from "../../../contexts/UIContext";
import UIButton from "../../generics/UIButton";

export default function ReencryptionModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();
    const { secrets, handleNewConversationKey } = useContext(UserSecretsContext);
    const { socket, resetSocket } = useContext(SocketContext);
    const { theme } = useContext(UIContext);

    const [stateReencryptor, setStateReencryptor] = useState<Reencryptor | undefined>();
    const [timeGap, setTimeGap] = useState(1000*60*60*24*30);
    const [dataPulled, setDataPulled] = useState(false);
    const [dataReencrypted, setDataReencrypted] = useState(false);
    const [newKeys, setNewKeys] = useState<{
        publicKey: Uint8Array,
        secretKey: Uint8Array,
    } | undefined>();
    const [userKeyMap, setUserKeyMap] = useState<{ [id: string]: string } | undefined>();
    const [error, setError] = useState<string | undefined>();
    const [canceled, setCanceled] = useState(false);
    const [reencryptionComplete, setReencryptionComplete] = useState(false);

    useEffect(() => {
        if (!socket || !socket.connected) {
            resetSocket();
        }
    }, [isOpen]);

    const startReencryption = useCallback(async () => {
        if (!stateReencryptor && (currentConvo)) {
            setStateReencryptor(reencryptor.init(currentConvo, conversationsApi));
            setCanceled(false);
        }
    }, [reencryptor, currentConvo]);

    const cancelReencryption = useCallback(async () => {
        if (dataReencrypted || reencryptionComplete) {
            return;
        } else if (dataPulled && currentConvo && secrets) {
            await stateReencryptor?.cancel();
            setStateReencryptor(undefined);
            setDataPulled(false);
            if (socket) {
                socket.emit('keyChange', currentConvo.id, currentConvo.publicKey, secrets[currentConvo.id]);
            }
            onModalClose();
        };
        setCanceled(true);
    }, [stateReencryptor, currentConvo, secrets]);

    useEffect(() => {
        if (canceled || !currentConvo || !stateReencryptor || dataPulled) {
            return;
        }

        const pullData = async () => {
            await stateReencryptor.pullEncryptedData(new Date((new Date()).getDate() - timeGap));
            setDataPulled(true);
        };

        pullData();
    }, [stateReencryptor, currentConvo, dataPulled, canceled]);

    useEffect(() => {
        if (canceled || dataReencrypted || !dataPulled || !currentConvo) {
            return;
        }

        const reencrypt = async () => {
            if (!currentConvo || !stateReencryptor || !secrets || !(currentConvo.id in secrets)) {
                setError('Unable to fetch reencryption data');
                return;
            }
            const generatedKeys = genKeyPair();
            setUserKeyMap(await stateReencryptor.reencrypt(secrets[currentConvo.id], generatedKeys));
            setNewKeys(generatedKeys);
            dispatch(updatePrivUsersForNewKey());
            setDataReencrypted(true);
        };

        reencrypt();
    }, [stateReencryptor, dataPulled, currentConvo, dataReencrypted, secrets, canceled]);

    useEffect(() => {
        if (canceled || !stateReencryptor || !dataPulled || !dataReencrypted || reencryptionComplete || !newKeys) return;

        const completeReencryption = async () => {
            if (!currentConvo || !newKeys) return;
            await stateReencryptor.commit();
            // console.log(newKeys);
            // console.log(secrets);
            await handleNewConversationKey(currentConvo.id, newKeys.secretKey);
            if (userKeyMap && socket && newKeys) {
                socket.emit('keyChange', currentConvo.id, encodeKey(newKeys.publicKey), userKeyMap);
            }
            dispatch(setCCPublicKey(encodeKey(newKeys.publicKey)));
            setReencryptionComplete(true);
        }
        completeReencryption();
    }, [reencryptionComplete, dataPulled, dataReencrypted, newKeys, userKeyMap, secrets, handleNewConversationKey]);

    const statusText = useMemo(() => {
        if (!dataPulled) {
            return 'Retrieving message data';
        } else if (!dataReencrypted) {
            return 'Reencrypting';
        } else if (!reencryptionComplete) {
            return 'Pushing reencryption data to server';
        } else {
            return 'Reencryption complete!';
        }
    }, [dataPulled, dataReencrypted, reencryptionComplete]);

    const setTimeGapForSelect = (itemValue: string) => {
        switch (itemValue) {
            case '1 month':
                setTimeGap(1000*60*60*24*30)
                break;
            case '1 week':
                setTimeGap(1000*60*60*24*7)
                break;
            case '1 day':
                setTimeGap(1000*60*60*24)
                break;
            case `Don't reencrypt`:
                setTimeGap(0)
                break;
        }
    };

    const selectVal = useMemo(() => {
        if (timeGap >= 1000*60*60*24*30) {
            return '1 month'
        } else if (timeGap >= 1000*60*60*24*7) {
            return '1 week'
        } else if (timeGap >= 1000*60*60*24) {
            return '1 day'
        } else {
            return `Don't reencrypt`;
        }
    }, [timeGap]);

    const onModalClose = () => {
        setStateReencryptor(undefined);
        setDataPulled(false);
        setDataReencrypted(false);
        setReencryptionComplete(false);
        setTimeGap(1000*60*60*24*30);
        setCanceled(false);
        setNewKeys(undefined);
        setUserKeyMap(undefined);
        onClose();
    }

    // start out with an icon plus start button + cancel button to start
    // then when it starts the encryption state should be displayed
    // cancel button eventually goes away while the changes get pushed
    // modal auto closes when finished
    return <Modal isOpen={isOpen} onClose={onModalClose} size='xl'>
        <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px' bgColor={colors.solid[theme]}>
            <VStack space={3}>
                <Center py='12px'>
                    <MaterialCommunityIcons name="arrow-vertical-lock" size={60} color={colors.textMainNB[theme]} />
                </Center>

                <Text color={colors.subTextNB[theme]} fontSize='xs'>
                    Changing the chat encryption key will trigger an automatic reencryption of recently sent messages. Messages sent further back than the time gap listed below will be deleted.
                </Text>

                {
                    (stateReencryptor && !reencryptionComplete) &&
                    <Center>
                        <Spinner type='ThreeBounce' color={colors.spinner[theme]} />
                    </Center>
                }

                {
                    stateReencryptor &&
                    <Center>
                        <Text color={colors.subTextNB[theme]}>
                            {statusText}
                        </Text>
                    </Center>
                }

                <Select fontWeight='bold'
                selectedValue={selectVal} w='100%' h='48px' borderRadius='24px' accessibilityLabel="Choose Poll Duration" placeholder="Choose Poll Duration" borderWidth='0px' bgColor={colors.select[theme]} color={colors.textMainNB[theme]} px='24px' mb='12px'
                _selectedItem={{
                    color: colors.textMainNB[theme],
                    fontWeight: 'bold',
                    borderRadius: '30px',
                    bg: "#f1f1f1",
                    endIcon: <CheckIcon size="5" />
                }}
                onValueChange={itemValue => setTimeGapForSelect(itemValue)}>
                    <Select.Item label="1 month" value="1 month" />
                    <Select.Item label="1 week" value="1 week" />
                    <Select.Item label="1 day" value="1 day" />
                    <Select.Item label="Don't reencrypt" value="Don't reencrypt" />
                </Select>

                {
                    error &&
                    <Center>
                        <Text fontSize='xs' color='red.500'>
                            {error}
                        </Text>
                    </Center>
                }

                {
                    !stateReencryptor &&
                    <UIButton context='primary' borderRadius='full' onPress={startReencryption}
                    opacity={socket?.connected ? 1 : 0} disabled={!socket?.connected}>
                        Start encryption key reset
                    </UIButton>
                }
                {
                    (dataPulled && !dataReencrypted) &&
                    <UIButton context='secondary' borderRadius='full' onPress={cancelReencryption}>
                        Cancel
                    </UIButton>
                }
                {
                    reencryptionComplete &&
                    <UIButton context='primary' borderRadius='full' onPress={onModalClose}>
                        Ok
                    </UIButton>
                }
            </VStack>
        </Modal.Content>
    </Modal>
}