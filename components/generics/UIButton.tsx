import React, { useContext, useMemo } from "react";
import { Button, IButtonProps, Text, Icon, CheckIcon, ITextProps } from "native-base";
import UIContext from "../../contexts/UIContext";

interface UIIconProps {
    as: any;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    check?: boolean;
}

interface UITextProps {
    fontSize?: string;
    fontWeight?: string | number;
    color?: string;
}

export default function UIButton({
    children,
    context,
    textProps,
    leftIconProps,
    rightIconProps,
    ...props
}: {
    context: 'primary' | 'secondary' | 'outline' | 'ghost';
    textProps?: UITextProps & ITextProps;
    leftIconProps?: UIIconProps;
    rightIconProps?: UIIconProps;
} & IButtonProps): JSX.Element {
    const { theme } = useContext(UIContext);

    const bgColorScheme = useMemo(() => {
        if (context === 'primary') {
            return theme === 'dark' ? 'light' : 'dark';
        } else {
            return theme === 'light' ? 'light' : 'dark';
        }
    }, [context, theme]);

    const textColor = useMemo(() => {
        return bgColorScheme === 'dark' ? 'white' : 'black';
    }, [bgColorScheme]);

    const nbColorScheme = useMemo(() => {
        if (context === 'primary') {
            return 'dark'
        } else if (context === 'secondary') {
            if (theme === 'dark') {
                return 'dark'
            }
            return 'light';
        }
        return theme;
    }, [context, theme]);

    const nbButtonVariant = useMemo(() => {
        if (context === 'primary') {
            return theme === 'dark' ? 'solid' : 'subtle';
        } else if (context === 'secondary') {
            return 'subtle';
        }
        return context;
    }, [context, theme]);

    const leftIcon = useMemo(() => {
        if (leftIconProps) {
            if (leftIconProps.check) {
                return <CheckIcon color={textColor} size={leftIconProps.size} />
            }
            return <Icon 
                color={textColor}
                as={leftIconProps.as} 
                name={leftIconProps.name}
                size={leftIconProps.size}
                />;
        }
        return undefined;
    }, [leftIconProps, textColor]);

    const rightIcon = useMemo(() => {
        if (rightIconProps) {
            if (rightIconProps.check) {
                return <CheckIcon color={textColor} size={rightIconProps.size} />
            }
            return <Icon 
                color={textColor}
                as={rightIconProps.as} 
                name={rightIconProps.name}
                size={rightIconProps.size}
                />;
        }
        return undefined;
    }, [rightIconProps, textColor]);

    return <Button 
        {...props} 
        colorScheme={nbColorScheme}
        variant={nbButtonVariant}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        // color={textColor}
        >
        <Text 
            color={textProps?.color || textColor}
            fontSize={textProps?.fontSize}
            fontWeight={textProps?.fontWeight}
            {...textProps}
        >{children as any}</Text>
    </Button>;
}