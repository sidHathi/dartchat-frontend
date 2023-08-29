import React, { useState, useMemo, useCallback, useContext } from "react";
import { Box, HStack, VStack, Heading, Text, Button, Center } from 'native-base'; 
import IconButton from "../generics/IconButton";
import IconImage from "../generics/IconImage";
import { selectIconImage } from "../../utils/messagingUtils";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { changeLikeIcon, chatSelector, resetLikeIcon } from "../../redux/slices/chatSlice";
import { LikeIcon } from "../../types/types";
import { getDownloadUrl, storeLikeIconImages } from "../../firebase/cloudStore";
import useRequest from "../../requests/useRequest";
import Spinner from "react-native-spinkit";
import { Asset } from "react-native-image-picker";
import SocketContext from "../../contexts/SocketContext";

export default function LikeButtonSelector({
    exit
}: {
    exit: () => void;
}): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const dispatch = useAppDispatch();
    const { conversationsApi } = useRequest();

    const [likeImageEmpty, setLikeImageEmpty] = useState<Asset | undefined>();
    const [likeImagePartial, setLikeImagePartial] = useState<Asset | undefined>();
    const [likeImageActive, setLikeImageActive] = useState<Asset | undefined>();
    const [edited, setEdited] = useState(false);
    const [reset, setReset] = useState(false);
    const [error, setError] = useState<string | undefined>();   
    const [uploading, setUploading] = useState(false);

    const convoCustomImage = useMemo(() => {
        if (!reset && currentConvo && currentConvo.customLikeIcon) return currentConvo.customLikeIcon;
        return undefined;
    }, [currentConvo, likeImageEmpty, reset]);

    const createIconObject: () => Promise<LikeIcon | undefined> = useCallback(async () => {
        if (!currentConvo) return undefined;
        if (!likeImageActive && !likeImageEmpty && !likeImagePartial) {
            setError('Please select images for all three states');
            return undefined;
        }
        setUploading(true);
        try {
            const { 
                emptyLoc,
                emptyTask, 
                partialLoc,
                partialTask, 
                activeLoc,
                activeTask
            } = await storeLikeIconImages(currentConvo.id, {
                empty: likeImageEmpty?.uri,
                partial: likeImagePartial?.uri,
                active: likeImageActive?.uri,
            });
            emptyTask && await emptyTask;
            partialTask && await partialTask;
            activeTask && await activeTask;
            const emptyImageUri = emptyTask ? await getDownloadUrl(emptyLoc) : convoCustomImage?.emptyImageUri;
            const partialImageUri = partialTask ? await getDownloadUrl(partialLoc) : convoCustomImage?.partialImageUri;
            const activeImageUri = activeTask ? await getDownloadUrl(activeLoc) : convoCustomImage?.activeImageUri;
            if (!emptyImageUri || !partialImageUri || !activeImageUri) {
                setError('Please select images for all three states');
                return undefined;
            }
            const iconObj: LikeIcon = {
                type: 'img',
                emptyImageUri,
                partialImageUri,
                activeImageUri,
            }
            setUploading(false);
            return iconObj;
        } catch (err) {
            console.log(err);
            setUploading(false);
            return undefined
        }
    }, [likeImageActive, likeImageEmpty, likeImagePartial, currentConvo]);

    const handleSubmit = useCallback(async () => {
        if (!currentConvo) return;
        if (reset && !likeImageActive && !likeImageEmpty && likeImagePartial) {
            dispatch(resetLikeIcon(conversationsApi, () => {
                socket && socket.emit('updateConversationDetails', currentConvo.id)
            }));
            exit();
            return;
        }

        const newIcon = await createIconObject();
        if (!newIcon) return;
        dispatch(changeLikeIcon(newIcon, conversationsApi, () => {
            socket && socket.emit('updateConversationDetails', currentConvo.id)
        }));
        exit();
    }, [createIconObject, reset, likeImageActive, likeImageEmpty, likeImagePartial, currentConvo]);

    const submitVisible = useMemo(() => {
        if ((likeImageActive || likeImageEmpty || likeImagePartial) || (reset && currentConvo?.customLikeIcon)) return true;
        return false;
    }, [likeImageActive, likeImageEmpty, likeImagePartial, reset]);

    const ButtonPreview = ({variant, image} : {
            variant: string, image?: Asset
        }) => {
        if (image && image.uri) {
            return <IconImage imageUri={image.uri} size={24} />;
        }
        switch (variant) {
            case 'empty':
                if (convoCustomImage && convoCustomImage.emptyImageUri) {
                    return <IconImage imageUri={convoCustomImage.emptyImageUri} size={24} />
                }
                return <IconButton label='heartEmpty' shadow='none' size={24} color='gray' />
            case 'partial':
                if (convoCustomImage && convoCustomImage.partialImageUri) {
                    return <IconImage imageUri={convoCustomImage.partialImageUri} size={24} />
                }
                return <IconButton label='heartFill' shadow='none' size={24} color='gray' />
            case 'active':
                if (convoCustomImage && convoCustomImage.activeImageUri) {
                    return <IconImage imageUri={convoCustomImage.activeImageUri} size={24} />
                }
                return <IconButton label='heartFill' size={24} shadow='none' color='red' />
            default:
                return <></>
        }
    };

    const newIconSelect = async (variant: string) => {
        switch (variant) {
            case 'empty':
                await selectIconImage(setLikeImageEmpty, setEdited);
                break;
            case 'partial':
                await selectIconImage(setLikeImagePartial, setEdited);
                break;
            case 'active':
                await selectIconImage(setLikeImageActive, setEdited);
                break;
            default: return;
        }
    };

    const resetVisible = useMemo(() => {
        if (likeImageActive || likeImageEmpty || likeImagePartial || (currentConvo?.customLikeIcon && !reset)) return true;
        return false;
    }, [edited, likeImageActive, likeImageEmpty, likeImagePartial, currentConvo, reset]);

    const resetIcons = () => {
        setEdited(true);
        setLikeImageActive(undefined);
        setLikeImageEmpty(undefined);
        setLikeImagePartial(undefined);
        setReset(true);
    };

    return <Box w='96%' mx='auto' bgColor='white' borderRadius='12px' shadow='9' p='24px' mt='12px' style={{shadowOpacity: 0.18}} flexShrink='0'>
        <HStack space={2} w='100%' flexShrink='0'>
            <IconButton label='back' color='black' size={18} shadow='none' additionalProps={{mt: '2px'}} onPress={exit}/>
            <Heading fontSize='lg'>Like Button</Heading>
        </HStack>
        <HStack w='100%' mt='12px' flexShrink='0'>
            <VStack w='33%' space={2}>
                <Text fontSize='xs' color='gray.500'>Default:</Text>
                <Center w='100%'>
                <ButtonPreview variant='empty' image={likeImageEmpty} />
                <Button colorScheme='dark' variant='subtle' opacity={0.8} borderRadius='24px' py='3px'onPress={() => newIconSelect('empty')} px='6px' mt='6px'>
                    <Text color='white' fontSize='8px'>
                    Change Icon
                    </Text>
                </Button>
                </Center>
            </VStack>
            <VStack w='33%' space={2}>
                <Text fontSize='xs' color='gray.500'>Liked:</Text>
                <Center w='100%'>
                <ButtonPreview variant='partial' image={likeImagePartial} />
                <Button colorScheme='dark' variant='subtle' opacity={0.8}borderRadius='24px' py='3px' onPress={() => newIconSelect('partial')} px='6px' mt='6px'>
                    <Text color='white' fontSize='8px'>
                    Change Icon
                    </Text>
                </Button>
                </Center>
            </VStack>
            <VStack w='33%' space={2}>
                <Text fontSize='xs' color='gray.500'>Liked by you:</Text>
                <Center w='100%'>
                <ButtonPreview variant='active' image={likeImageActive} />
                <Button colorScheme='dark' variant='subtle' opacity={0.8}borderRadius='24px' py='3px' onPress={() => newIconSelect('active')} px='6px' mt='6px'>
                    <Text color='white' fontSize='8px'>
                    Change Icon
                    </Text>
                </Button>
                </Center>
            </VStack>
        </HStack>
        {
            uploading &&
            <Center w='100%'>
                <Spinner type="ThreeBounce" />
            </Center>
        }
        {
            error &&
            <Center w='100%'>
                <Text fontSize='xs' color='red.500'>{error}</Text>
            </Center>
        }
        {
            submitVisible &&
            <Button w='100%' colorScheme='dark' variant='subtle' borderRadius='full' mt='12px' size='sm' onPress={handleSubmit}>
                Save
            </Button>
        }
        {
            resetVisible &&
            <Button w='100%' colorScheme='light' variant='subtle' borderRadius='full' mt='12px' size='sm' onPress={resetIcons}>
                Reset
            </Button>
        }
    </Box>
}