import React from 'react';
import MembersList from './MembersList';

export type MenuPage = 'members' | 'search' | 'gallery' | 'polls' | 'events' | 'encryption'; 

export default function ExpandedSettingsMenu({
    currPage,
}: {
    currPage: MenuPage;
}): JSX.Element {
    const getElem = () => {
        switch (currPage) {
            case 'members':
                return <MembersList />;
            default:
                return <></>;
        }
    };

    return getElem();
}