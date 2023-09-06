//
//  NotificationService.swift
//  EncryptionNotificationService
//
//  Created by Siddharth Hathi on 9/3/23.
//

import UserNotifications
//import RNCAsyncStorage

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
  
    func getNotifBodyFromDecryptedFields(fields: DecryptedFields) -> String {
      if !fields.content.isEmpty {
        return fields.content;
      } else if fields.media != nil {
        return "Media:"
      }
      return "Encrypted message";
    };
  
    func shouldNotify(user: UserData, cid: String, message: EncryptedMessage) -> Bool {
      let preview = user.conversations?.first(where: { $0.cid == cid });
      if (preview == nil || preview!.notfications?.rawValue ?? "all" == "all") {
        return true;
      }
      
      if (message.mentions != nil && message.mentions!.first(where: {
        $0.id == user.id
      }) != nil && preview?.notfications?.rawValue ?? "all" == "mentions") {
        return true;
      }
      
      return false;
    };
  
  func getMentionNotif(user: UserData, cid: String, message: EncryptedMessage) -> String? {
    let preview = user.conversations?.first(where: { $0.cid == cid });
    if (preview != nil && message.mentions != nil && message.mentions!.first(where: {
      $0.id == user.id
    }) != nil) {
      let prefix = message.senderProfile?.displayName ?? "A user"
      return prefix + " mentioned you in \"" + preview!.name + "\"";
    }
    
    return nil;
  }

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
      bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent);
        
      if let bestAttemptContent = bestAttemptContent {
          // Modify the notification content here...
//            bestAttemptContent.title = "Intercepted title [modified]"
          let notifee_options: [AnyHashable: Any] = bestAttemptContent.userInfo["notifee_options"] as! [AnyHashable : Any];
          if let body = notifee_options["stringifiedBody"], let messageType = notifee_options["type"]  {
            if (messageType as! String == "message") {
              let jsonBody = (body as! String).data(using: .utf8) ?? nil;
              if jsonBody != nil {
                do {
                  let messagePacket: EncryptedMessagePacket = try JSONDecoder().decode(EncryptedMessagePacket.self, from: jsonBody!);
                  let cid: String = messagePacket.cid;
                  let message: EncryptedMessage = messagePacket.message;
                  bestAttemptContent.body = message.encryptedFields!;
                  let userDefaults = UserDefaults(suiteName: "group.dartchat");
                  let stringifiedUserData = userDefaults!.string(forKey: "userData");
                  let parsedUserData = try JSONDecoder().decode(UserData.self, from: (stringifiedUserData?.data(using: .utf8))!);
                  
                  if !shouldNotify(user: parsedUserData, cid: cid, message: message) {
                    contentHandler(bestAttemptContent);
                    return;
                  }
                  
                  if let mentionNotif = getMentionNotif(user: parsedUserData, cid: cid, message: message) {
                    bestAttemptContent.body = mentionNotif;
                    contentHandler(bestAttemptContent);
                    return;
                  }
                  
                  if message.encryptedFields != nil {
                    bestAttemptContent.body = parsedUserData.handle!;
                    let decryptedMessageFields = Decryptor.decryptMessage(cid: cid, message: message, storedUserData: parsedUserData);
                    if (decryptedMessageFields != nil) {
                      bestAttemptContent.body = getNotifBodyFromDecryptedFields(fields: decryptedMessageFields!);
                    }
                  }
                } catch {
                  print("Message decode failed");
                }
              }
            }
          }
        contentHandler(bestAttemptContent)
      }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

}
