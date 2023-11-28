//
//  Decryptor.swift
//  dartchat
//
//  Created by Siddharth Hathi on 9/5/23.
//

import Foundation
import TweetNacl

public let nonceLength = 24;

extension Data {
    init?(base64EncodedURLSafe string: String, options: Base64DecodingOptions = []) {
      let string = string
          .replacingOccurrences(of: "-", with: "+")
          .replacingOccurrences(of: "_", with: "/")

      self.init(base64Encoded: string, options: options)
  }
}

public class Decryptor {
  public static func decryptMessage(cid: String, message: EncryptedMessage, storedUserData: UserData) -> DecryptedFields? {
    if (message.encryptedFields == nil) {
//      return DecryptedFields(content: "Encrypted fields not found");
      return nil;
    }
    
    let senderProfile = message.senderProfile;
    if (senderProfile == nil || senderProfile?.publicKey == nil) {
//      return DecryptedFields(content: "Sender profile not found");
      return nil;
    }
    let decodedPublicKey = decodeKey(senderProfile!.publicKey!);
    
    let secretKey = getSecretKeyForConvo(cid: cid, uid: storedUserData.id);
    if (secretKey == nil) {
//      return DecryptedFields(content: "Public Key " + decodedPublicKey!.base64EncodedString());
      return nil;
    }
    
    let decryptedString = decryptString(secretKey: secretKey!, stringVal: message.encryptedFields!, publicKey: decodedPublicKey!);
    if (decryptedString == nil) {
//      return DecryptedFields(content: "Secret key " + secretKey!.base64EncodedString());
      return nil;
    }
    do {
      let parsedJSON = try JSONDecoder().decode(DecryptedFields.self, from: decryptedString!.data(using: .utf8)!);
      return parsedJSON;
    } catch {
//      return DecryptedFields(content: "Final JSON parse failed " + decryptedString!);
      return nil;
    }
  }
  
  public static func decodeKey(_ encoded: String) -> Data? {
      return Data(base64EncodedURLSafe: encoded, options: .ignoreUnknownCharacters);
  }
  
  public static func getSecretKeyForConvo(cid: String, uid: String) -> Data? {
    let userDefaults = UserDefaults(suiteName: "group.dartchat")!;
    let key = "user-" + uid + "-secrets";
    let keyStore = userDefaults.string(forKey: key);
    if (keyStore == nil) {
      return nil;
    }
    
    do {
      let parsedKeyStore = try JSONDecoder().decode([String: String].self, from: keyStore!.data(using: .utf8)!);
      let encodedSecretKey = parsedKeyStore[cid];
      if (encodedSecretKey != nil) {
        return decodeKey(encodedSecretKey!);
      }
      return nil;
    } catch {
      return nil;
    }
  }
  
  private static func decryptString(secretKey: Data, stringVal: String, publicKey: Data?) -> String? {
    do {
      let decodedWithNonce = decodeKey(stringVal)!;
      let nonce = decodedWithNonce[0..<nonceLength];
      let encryptedString = decodedWithNonce[nonceLength...];
      
      var decryptedContent: Data? = nil;
      decryptedContent = try NaclBox.open(message: encryptedString, nonce: nonce, publicKey: publicKey!, secretKey: secretKey);
      
      if (decryptedContent == nil) {
        return nil;
      }
      
      return String(decoding: decryptedContent!, as: UTF8.self);
    } catch {
      return nil
    }
  }
}
