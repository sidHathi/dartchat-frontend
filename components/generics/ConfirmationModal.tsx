import React from 'react';
import { Modal, Button, Text } from 'native-base';

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
    return (
        <Modal
            isOpen={ isOpen }
            onClose={ onClose }
            size={size}
        >
            <Modal.Content>
                <Modal.CloseButton />
                <Modal.Header>
                    {title}
                </Modal.Header>
                <Modal.Body>
                    <Text>{ content }</Text>
                </Modal.Body>
                <Modal.Footer>

                <Button.Group space={2}>
                <Button variant="ghost" colorScheme="blueGray" onPress={onClose}px='24px' borderRadius='24px'>
                    Cancel
                </Button>
                <Button onPress={onConfirm} px='24px' borderRadius='24px' bgColor='coolGray.700'>
                    Confirm
                </Button>
                </Button.Group>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}