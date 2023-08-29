import React, { createContext } from 'react';

const MentionSuggestionContext = createContext<{
    showingSuggestions: boolean,
    setShowingSuggestions: (newVal : boolean) => void
}>({showingSuggestions: false, setShowingSuggestions: () => {}});

export default MentionSuggestionContext;
