import React from 'react';
import MembersList from './MembersList';
import MediaGallery from '../Galleries/MediaGallery';
import PollGallery from '../Galleries/PollGallery';
import EventGallery from '../Galleries/EventGallery';
import EncryptionSettings from './EncryptionSettings/EncryptionSettings';

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
            case 'gallery':
                return <MediaGallery />;
            case 'polls':
                return <PollGallery />;
            case 'events':
                return <EventGallery />;
            case 'encryption':
                return <EncryptionSettings />;
            default:
                return <></>;
        }
    };

    return getElem();
}