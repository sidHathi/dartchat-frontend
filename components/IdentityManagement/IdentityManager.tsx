import React, { useState, useContext } from 'react';
import ProfileDisplay from './ProfileDisplay';
import UIContext from '../../contexts/UIContext';
import ProfileEditor from './ProfileEditor';

export default function IdentityManager(): JSX.Element {
    const [editMode, setEditMode] = useState(false);
    const { navSwitch } = useContext(UIContext);

    const handleExit = () => {
        navSwitch('conversations');
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    }

    return (
        !editMode ? 
            <ProfileDisplay handleExit={handleExit} toggleEditMode={toggleEditMode}/> :
        <ProfileEditor handleExit={toggleEditMode} />
    );
}