import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('Crypto Utility Loading Version 1.1...');

const PRIVATE_KEY_STORAGE = 'e2ee_private_key';
const PUBLIC_KEY_STORAGE = 'e2ee_public_key';

export async function initCrypto() {
    // No-op for tweetnacl
}

export async function getOrCreateKeyPair() {
    let privateKeyBase64 = await AsyncStorage.getItem(PRIVATE_KEY_STORAGE);
    let publicKeyBase64 = await AsyncStorage.getItem(PUBLIC_KEY_STORAGE);

    if (!privateKeyBase64 || !publicKeyBase64) {
        const keyPair = nacl.box.keyPair();
        privateKeyBase64 = Buffer.from(keyPair.secretKey).toString('base64');
        publicKeyBase64 = Buffer.from(keyPair.publicKey).toString('base64');

        await AsyncStorage.setItem(PRIVATE_KEY_STORAGE, privateKeyBase64);
        await AsyncStorage.setItem(PUBLIC_KEY_STORAGE, publicKeyBase64);
    }

    return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64
    };
}

export async function encryptForBoth(message: string, recipientPublicKeyBase64: string, senderPublicKeyBase64: string) {
    if (!recipientPublicKeyBase64 || !senderPublicKeyBase64) {
        throw new Error('Missing public keys for dual encryption');
    }

    const ephemeralKeyPair = nacl.box.keyPair();
    const recipientPubKey = Buffer.from(recipientPublicKeyBase64, 'base64');
    const senderPubKey = Buffer.from(senderPublicKeyBase64, 'base64');
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = Buffer.from(message);

    // Encrypt for recipient
    const encryptedForRecipient = nacl.box(
        messageUint8,
        nonce,
        recipientPubKey,
        ephemeralKeyPair.secretKey
    );

    // Encrypt for sender (history)
    const encryptedForSender = nacl.box(
        messageUint8,
        nonce,
        senderPubKey,
        ephemeralKeyPair.secretKey
    );

    const fullRecipient = new Uint8Array(nonce.length + encryptedForRecipient.length);
    fullRecipient.set(nonce);
    fullRecipient.set(encryptedForRecipient, nonce.length);

    const fullSender = new Uint8Array(nonce.length + encryptedForSender.length);
    fullSender.set(nonce);
    fullSender.set(encryptedForSender, nonce.length);

    return {
        content: Buffer.from(fullRecipient).toString('base64'),
        contentForSender: Buffer.from(fullSender).toString('base64'),
        ephemeralPublicKey: Buffer.from(ephemeralKeyPair.publicKey).toString('base64')
    };
}

export async function decryptMessage(encryptedFullBase64: string, ephemeralPublicKeyBase64: string, myPrivateKeyBase64: string) {
    try {
        if (!encryptedFullBase64 || !ephemeralPublicKeyBase64) {
            return '[Message]';
        }

        const fullEncrypted = Buffer.from(encryptedFullBase64, 'base64');
        const ephemeralPubKey = Buffer.from(ephemeralPublicKeyBase64, 'base64');
        const myPrivKey = Buffer.from(myPrivateKeyBase64, 'base64');

        if (fullEncrypted.length < nacl.box.nonceLength) {
            return '[Message]';
        }

        const nonce = fullEncrypted.slice(0, nacl.box.nonceLength);
        const encrypted = fullEncrypted.slice(nacl.box.nonceLength);

        const decrypted = nacl.box.open(
            encrypted,
            nonce,
            ephemeralPubKey,
            myPrivKey
        );

        if (!decrypted) {
            return '[Message]';
        }
        return Buffer.from(decrypted).toString();
    } catch (error) {
        return '[Message]';
    }
}
