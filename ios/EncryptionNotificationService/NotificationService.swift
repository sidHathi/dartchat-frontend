//
//  NotificationService.swift
//  EncryptionNotificationService
//
//  Created by Siddharth Hathi on 9/3/23.
//

import UserNotifications
import RNNotifeeCore

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
  
  func getNotifBodyFromDecryptedFields(fields: DecryptedFields, cid: String, user: UserData, message: EncryptedMessage) -> String {
    var prefix = "";
    if let matchingPreview = user.conversations?.first(where: { $0.cid == cid }) {
      if ((matchingPreview.group ?? true) && message.senderProfile != nil) {
        prefix = message.senderProfile!.displayName + ": "
      }
    }
      if !fields.content.isEmpty {
        return prefix + fields.content;
      } else if fields.media != nil {
        return prefix + "Media:"
      }
      return prefix + "Encrypted message";
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
//        bestAttemptContent.body = "Handler running";
        let notifee_options: [AnyHashable: Any]? = bestAttemptContent.userInfo["notifee_options"] as? [AnyHashable : Any];
        let stringifiedOptions = notifee_options?.description;
        if (stringifiedOptions != nil) {
//          bestAttemptContent.body = stringifiedOptions!;
        } else {
//          bestAttemptContent.body = "Pre parse";
          NotifeeExtensionHelper.populateNotificationContent(request, with: bestAttemptContent, withContentHandler: contentHandler);
          return;
        }
        if let body = notifee_options!["stringifiedBody"], let messageType = notifee_options!["type"]  {
//            bestAttemptContent.body = "Pre type check";
            if (messageType as! String == "message") {
              let jsonBody = (body as? String)?.data(using: .utf8) ?? nil;
              if jsonBody != nil {
                let messagePacket: EncryptedMessagePacket? = try? JSONDecoder().decode(EncryptedMessagePacket.self, from: jsonBody!);
                if (messagePacket == nil) {
                  NotifeeExtensionHelper.populateNotificationContent(request, with: bestAttemptContent, withContentHandler: contentHandler);
                  return;
//                  bestAttemptContent.body = "Message packet invalid";
                }
                // last working spot

                let cid: String = messagePacket!.cid;
                let message: EncryptedMessage = messagePacket!.message;
                let userDefaults = UserDefaults(suiteName: "group.dartchat");

                if (userDefaults == nil) {
                  NotifeeExtensionHelper.populateNotificationContent(request, with: bestAttemptContent, withContentHandler: contentHandler);
                  return;
//                  bestAttemptContent.body = "user defaults not found";
                }
                let stringifiedUserData = userDefaults!.string(forKey: "userData");
                if (stringifiedUserData == nil) {
                  NotifeeExtensionHelper.populateNotificationContent(request, with: bestAttemptContent, withContentHandler: contentHandler);
                  return;
//                  bestAttemptContent.body = "No key stored for user";
                }

                let parsedUserData: UserData? = try? JSONDecoder().decode(UserData.self, from: (stringifiedUserData!.data(using: .utf8))!);
                if (parsedUserData == nil) {
                  bestAttemptContent.body = stringifiedUserData!;
                }

                if let mentionNotif = getMentionNotif(user: parsedUserData!, cid: cid, message: message) {
                  bestAttemptContent.body = mentionNotif;
                  NotifeeExtensionHelper.populateNotificationContent(request, with: bestAttemptContent, withContentHandler: contentHandler);
                  return;
                }

                if message.encryptedFields != nil {
                  let decryptedMessageFields = Decryptor.decryptMessage(cid: cid, message: message, storedUserData: parsedUserData!);
                  if (decryptedMessageFields != nil) {
                    bestAttemptContent.body = getNotifBodyFromDecryptedFields(fields: decryptedMessageFields!, cid: cid, user: parsedUserData!, message: message);
                  }
                }
              }
            }
          }
////        contentHandler(bestAttemptContent)
        NotifeeExtensionHelper.populateNotificationContent(request, with: bestAttemptContent, withContentHandler: contentHandler);
      }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
          bestAttemptContent.body = "timeout"
            contentHandler(bestAttemptContent)
        }
    }

}
