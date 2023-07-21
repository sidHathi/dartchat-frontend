import React from 'react';
import MembersList from './MembersList';

export type MenuPage = 'members' | 'search' | 'gallery' | 'polls' | 'events' | 'encryption'; 

export default function ExpandedSettingsMenu({
    currPage,
    exit
}: {
    currPage: MenuPage;
    exit: () => void;
}): JSX.Element {
    const getElem = () => {
        switch (currPage) {
            case 'members':
                return <MembersList exit={exit} />;
            default:
                return <></>;
        }
    };

    return getElem();
}