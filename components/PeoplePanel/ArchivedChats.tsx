import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Box, HStack, Text, Spacer, VStack, Button, Center, ScrollView, Heading } from "native-base";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { handleRoleUpdate, joinConversation, removeArchivedConvo, userDataSelector } from "../../redux/slices/userDataSlice";
import { Conversation } from "../../types/types";
import useRequest from "../../requests/useRequest";
import IconImage from "../generics/IconImage";
import IconButton from "../generics/IconButton";
import Spinner from "react-native-spinkit";
import SocketContext from "../../contexts/SocketContext";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { buildDefaultProfileForUser } from "../../utils/identityUtils";
import UserSecretsContext from "../../contexts/UserSecretsContext";
import colors from "../colors";
import UIContext from "../../contexts/UIContext";
import UIButton from "../generics/UIButton";

export default function ArchivedChats(): JSX.Element {
    const dispatch = useAppDispatch();
    const { archivedConvos: archivedConvoIds } = useAppSelector(userDataSelector);
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { conversationsApi, usersApi } = useRequest();
    const { forgetConversationKeys } = useContext(UserSecretsContext);
    const { theme } = useContext(UIContext);

    const [archivedConvoData, setArchivedConvoData] = useState<Conversation[] | undefined>();
    const [pullRequestLoading, setPullRequestLoading] = useState(false);

    useEffect(() => {
        if (!archivedConvoIds || archivedConvoIds.length === 0) {
            setArchivedConvoData(undefined)
            return;
        }
        const pullConvoData = async () => {
            setPullRequestLoading(true);
            try {
                const convoData = await conversationsApi.getConversationsForIds(archivedConvoIds);
                setArchivedConvoData(convoData);
                setPullRequestLoading(false);
            } catch (err) {
                console.log(err);
                setPullRequestLoading(false);
                return;
            }
        };
        pullConvoData();
    }, [archivedConvoIds]);

    const rejoinConvo = useCallback((convo: Conversation) => {
        if (socket && user) {
            dispatch(joinConversation(convo.id, conversationsApi, usersApi, () => {
                let joiningProfile = buildDefaultProfileForUser(user);
                if (convo.adminIds?.includes(user.id)) {
                    joiningProfile = {
                        ...joiningProfile,
                        role: 'admin'
                    }
                    dispatch(handleRoleUpdate({cid: convo.id, newRole: 'admin'}));
                }
                socket.emit('newConversationUsers', convo.id, [joiningProfile]);
            }));
        }
    }, [socket, conversationsApi, usersApi, user]);

    const archiveRemove = useCallback((cid: string) => {
        dispatch(removeArchivedConvo(cid, usersApi, () => {
            forgetConversationKeys(cid);
        }));
    }, [usersApi]);

    const getConvoAvatarElem = (convo: Conversation) => {
        if (convo.avatar) {
            return <IconImage imageUri={convo.avatar.mainUri} size={66} shadow='9' />;
        }
        return <IconButton label='profile' size={66} shadow="9" />;
    }

    const convoCard = (convo: Conversation) => {
        return <Box w='100%' borderRadius='12px' bgColor={colors.message[theme]} p='12px' my='6px'>
            <HStack px='12px' space={6} py='6px'>
                 <Spacer />
                <VStack my='6px' w='20%'>
                    <Spacer />
                    <Center>
                    {getConvoAvatarElem(convo)}
                    
                    </Center>
                    <Spacer />
                </VStack>
                <VStack w='80%' space='2'>
                    <Spacer />
                    <Box w='70%'>
                    <Heading fontSize='md' mt='12px' mx='auto' maxW='100%' color={colors.textMainNB[theme]}>
                        {convo.name}
                    </Heading>
                    <Text fontSize='9px' mx='auto' mb='6px' maxW='100%' color={colors.textMainNB[theme]}>
                        {`${convo.participants.length} members`}
                    </Text>
                    <UIButton borderRadius='24px' context='primary' size='sm' my='6px' onPress={() => rejoinConvo(convo)} mr='auto' w='100%'>
                        Rejoin
                    </UIButton>
                    <UIButton borderRadius='24px' context='secondary' size='sm' onPress={() => archiveRemove(convo.id)} mr='auto' flexShrink='0' w='100%'>
                        <Text color='error.500' fontSize='xs'>
                            Remove permanently
                        </Text>
                    </UIButton>
                    </Box>
                    <Spacer />
                </VStack>
                 <Spacer />
            </HStack>
           
        </Box>
    }

    return <View flex='1' px='12px'>
        <Text color={colors.textLightNB[theme]} fontWeight='bold' fontSize='xs'>
            Chats you left:
        </Text>
        {
            pullRequestLoading &&
            <Center w='100%' h='100%'>
                <Spinner type='ThreeBounce' color={colors.textMainNB[theme]} />
            </Center>
        }
        {
            (archivedConvoData !== undefined && archivedConvoData.length > 0) ?
        
            <ScrollView w='100%' h='100%'>
                <VStack space={1}>
                {
                    archivedConvoData.map((convo) => <Box key={convo.id}>{convoCard(convo)}</Box>)
                }
                <Box h='100px'></Box>
                </VStack>
            </ScrollView> :
            <Center flex='1'>
                <Text color={colors.textMainNB[theme]}>
                    Archive empty
                </Text>
            </Center>
        }
    </View>
}
