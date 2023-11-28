import React from "react";
import { HStack, Button, Box, Spacer } from 'native-base';
import UIButton from "./UIButton";

export default function SpacedTabs({
    options,
    selectedOption,
    setSelectedOption
}: {
    options: string[];
    selectedOption: string;
    setSelectedOption: (selection: string) => void;
}): JSX.Element {
    return (
        <Box w='100%'>
            <HStack w='100%'>
                {
                    options.map((opt, idx) => {
                        const widthPer = 1/options.length * 100 - 2;
                        return <UIButton 
                            key={`${opt}-${idx}`}
                            w={`${widthPer}%`} 
                            mx='auto' 
                            borderRadius='24px' 
                            context={opt === selectedOption ? 'primary' : 'secondary'}
                            onPress={() => setSelectedOption(opt)}
                            size='sm'
                            textProps={{
                                fontSize: '12px'
                            }}>
                            {`${opt}`}
                        </UIButton>
                    })
                }
            </HStack>
        </Box>
    )
}
