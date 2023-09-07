//
//  Decodables.swift
//  EncryptionNotificationService
//
//  Created by Siddharth Hathi on 9/3/23.
//

import Foundation

public struct AvatarImage: Decodable {
  let tinyUri: String;
  let mainUri: String;
};

public enum ChatRole: String, Decodable {
  case admin, plebian
};

public enum NotificationStatus: String, Decodable {
  case all, mentions, none
};

public struct UserConversationProfile: Decodable {
  let id: String;
  let handle: String?;
  let displayName: String;
  let avatar: AvatarImage?;
  let notificationStatus: NotificationStatus?;
  let publicKey: String?;
  let role: ChatRole?;
  let customProfile: Bool?;
};

public struct Mention: Decodable {
  let id: String;
  let displayName: String;
};

public struct ReplyRef: Decodable {
  let id: String;
  let content: String;
  let senderId: String;
  let media: [String]?;
};

public struct MessageMedia: Decodable {
  let id: String;
  let type: String;
  let uri: String;
  let width: Double;
  let height: Double;
};

public struct ObjectRef: Decodable {
  let id: String;
  let type: String;
};

public struct EncryptedMessage: Decodable {
  enum MessageType: String, Decodable {
    case system, user, deletion
  };

  enum EncryptionLevel: String, Decodable {
    case none, encrypted, doubleRatchet
  };
  
  let id: String;
  let timestamp: String;
  let messageType: MessageType;
  let encryptionLevel: EncryptionLevel?;
  let senderId: String;
  let likes: [String];
  let inGallery: Bool?;
  let senderProfile: UserConversationProfile?;
  let delivered: Bool?;
  let mentions: [Mention]?;
  let replyRef: ReplyRef?;
  let messageLink: String?;
  let encryptedFields: String?;
};

public struct DecryptedFields: Decodable {
  var content: String;
  var media: MessageMedia?;
};

public struct EncryptedMessagePacket: Decodable {
  public let cid: String;
  public let message: EncryptedMessage;
};

public struct ConversationPreview: Decodable {
  let cid: String;
  let name: String;
  let lastMessageContent: String?;
  let lastMessage: EncryptedMessage?;
  let unSeenMessages: Int;
  let avatar: AvatarImage?;
  let lastMessageTime: String?;
  let recipientId: String?;
  let group: Bool?;
  let keyUpdate: String?;
  let publicKey: String?;
  let userRole: ChatRole?;
  let notfications: NotificationStatus?;
}

public struct UserData: Decodable {
  public let id: String;
  let email: String;
  let handle: String?;
  let displayName: String?;
  let phone: String?;
  let conversations: [ConversationPreview]?;
  let avatar: AvatarImage?;
  let contacts: [String]?;
  let archivedConvos: [String]?;
  let publicKey: String?;
  let keySalt: String?; // base64 encoded random prime number
  let secrets: String?;
  let pushTokens: [String]?;
}
