import React, { useContext } from 'react';
import { Modal, Button, Text, VStack, Heading } from 'native-base';
import UIContext from '../../contexts/UIContext';
import colors from '../colors';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    content,
    size
} : {
    isOpen : boolean,
    onClose : () => void,
    onConfirm : () => void,
    title : string,
    content : string,
    size: string,
}) : JSX.Element {
    const { theme } = useContext(UIContext);
    return (
        <Modal
            isOpen={ isOpen }
            onClose={ onClose }
            size={size}
        >
            <Modal.Content borderRadius='24px' shadow='9' p='24px' bgColor={colors.solid[theme]}>
                <Modal.CloseButton />
                <VStack space={3}>
                    <Heading color={colors.textMainNB[theme]}>
                        {title}
                    </Heading>
                    <Text color={colors.textMainNB[theme]}>{ content }</Text>

                    <Button.Group space={2}>
                    <Button variant="subtle" colorScheme="light" onPress={onClose}px='24px' borderRadius='24px' w='50%'>
                        Cancel
                    </Button>
                    <Button onPress={onConfirm} px='24px' borderRadius='24px' colorScheme='dark' variant='subtle' w='50%'>
                        Confirm
                    </Button>
                    </Button.Group>
                </VStack>
            </Modal.Content>
        </Modal>
    );
}