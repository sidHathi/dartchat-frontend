import React, { createContext, useState } from "react";
import { Conversation } from "../types/types";

type ConversationsContextType = {
    createNewConversation: (newConvo: Conversation) => void;
    deleteConversation: (conversationId: string) => void;
}

const ConversationsContext = createContext<ConversationsContextType>({
    createNewConversation: () => {},
    deleteConversation: () => {}
});

export default ConversationsContext;
