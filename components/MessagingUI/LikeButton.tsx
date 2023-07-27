import React, { useMemo, useContext } from "react";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";
import { Message } from "../../types/types";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import IconImage from "../generics/IconImage";
import IconButton from "../generics/IconButton";

export default function LikeButton({
    message,
    onPress
}: {
    message: Message,
    onPress: () => void
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);

    const variant = useMemo(() => {
        if (user && message.likes.length > 0 && message.likes.includes(user.id)) {
            return 'active'
        } else if (message.likes.length > 0) {
            return 'partial'
        }
        return 'empty';
    }, [message]);

    const imageUris = useMemo(() => {
        if (currentConvo && currentConvo.customLikeIcon) {
            return {
                empty: currentConvo.customLikeIcon.emptyImageUri,
                partial: currentConvo.customLikeIcon.partialImageUri,
                active: currentConvo.customLikeIcon.activeImageUri
            }
        }
        return undefined;
    }, [currentConvo]);

    const button = useMemo(() => {
        switch (variant) {
            case 'empty':
                if (imageUris && imageUris.empty) {
                    return <IconImage imageUri={imageUris.empty} size={20} onPress={onPress} />
                }
                return <IconButton label='heartEmpty' color='gray' size={20} onPress={onPress} shadow='none' /> 
            case 'partial':
                if (imageUris && imageUris.partial) {
                    return <IconImage imageUri={imageUris.partial} size={20} onPress={onPress} />
                }
                return <IconButton label='heartFill' color='gray' size={20} onPress={onPress} shadow='none' /> 
            case 'active':
                if (imageUris && imageUris.active) {
                    return <IconImage imageUri={imageUris.active} size={20} onPress={onPress} />
                }
                return <IconButton label='heartFill' color='red' size={20} onPress={onPress} shadow='9' /> 
        }
    }, [imageUris, variant]);

    return button;
}