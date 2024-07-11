import CryptoJS from 'crypto-js';

const KyberLike = () => {
    const generatePolynomial = (seed) => {
        const result = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            result[i] = CryptoJS.SHA256(`${seed}${i}`).words[0] & 0x1fff;
        }
        return result;
    };

    const generateKeyPair = (seed) => {
        const s = generatePolynomial(seed);
        const e = generatePolynomial(CryptoJS.SHA256(seed + "noise").toString());
        const a = generatePolynomial(CryptoJS.SHA256(seed + "base").toString());
        const t = s.map((si, i) => (si + e[i]) & 0x1fff);
        return { publicKey: { t, a }, privateKey: s };
    };

    const encapsulate = (publicKey, seed) => {
        const { t, a } = publicKey;
        const r = generatePolynomial(CryptoJS.SHA256(seed + "r").toString());
        const e1 = generatePolynomial(CryptoJS.SHA256(seed + "e1").toString());
        const e2 = generatePolynomial(CryptoJS.SHA256(seed + "e2").toString());
        const u = r.map((ri, i) => (ri + e1[i]) & 0x1fff);
        const v = t.map((ti, i) => (ti * r[i] + e2[i]) & 0x1fff);
        const sharedSecret = CryptoJS.SHA256(v.join() + seed).toString();
        return { ciphertext: { u, v }, sharedSecret };
    };

    const decapsulate = (privateKey, ciphertext, seed) => {
        const { u, v } = ciphertext;
        const sharedSecret = CryptoJS.SHA256(v.join() + seed).toString();
        return sharedSecret;
    };

    const deriveKey = (password, salt) => {
        return CryptoJS.PBKDF2(password, salt, { keySize: 512 / 32, iterations: 10000 });
    };

    const encrypt = async (fileContentBase64, password, progressCallback) => {
        const totalSteps = 7;
        let currentStep = 0;

        const salt = CryptoJS.lib.WordArray.random(128 / 8);
        const key = deriveKey(password, salt);
        const iv = CryptoJS.lib.WordArray.random(128 / 8);
        currentStep++;
        progressCallback(currentStep, totalSteps);

        const aesEncrypted = CryptoJS.AES.encrypt(fileContentBase64, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        currentStep++;
        progressCallback(currentStep, totalSteps);

        const seed = CryptoJS.SHA256(password + salt.toString()).toString();
        const { publicKey } = generateKeyPair(seed);
        currentStep++;
        progressCallback(currentStep, totalSteps);

        const { ciphertext, sharedSecret } = encapsulate(publicKey, seed);
        currentStep++;
        progressCallback(currentStep, totalSteps);

        const pqIv = CryptoJS.lib.WordArray.random(128 / 8);
        const pqEncrypted = CryptoJS.AES.encrypt(aesEncrypted.toString(), sharedSecret, {
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
            iv: pqIv
        });
        currentStep++;
        progressCallback(currentStep, totalSteps);

        const dataToAuthenticate = [
            salt.toString(),
            iv.toString(),
            pqIv.toString(),
            ciphertext.u.join(','),
            ciphertext.v.join(','),
            pqEncrypted.toString()
        ].join('|');

        const hmac = CryptoJS.HmacSHA256(dataToAuthenticate, key);
        currentStep++;
        progressCallback(currentStep, totalSteps);

        const finalEncrypted = dataToAuthenticate + '|' + hmac.toString();
        currentStep++;
        progressCallback(currentStep, totalSteps);

        return finalEncrypted;
    };

    const decrypt = (encryptedData, password) => {
        if (!encryptedData) {
            throw new Error('Encrypted data is undefined or empty');
        }

        const parts = encryptedData.split('|');
        if (parts.length !== 7) {
            throw new Error('Invalid encrypted data format');
        }

        const [salt, iv, pqIv, ciphertextU, ciphertextV, pqEncrypted, receivedHmac] = parts;

        const key = deriveKey(password, CryptoJS.enc.Hex.parse(salt));
        
        // Verify HMAC
        const dataToAuthenticate = parts.slice(0, -1).join('|');
        const computedHmac = CryptoJS.HmacSHA256(dataToAuthenticate, key);
        if (computedHmac.toString() !== receivedHmac) {
            throw new Error('Data integrity check failed');
        }

        const u = new Uint32Array(ciphertextU.split(',').map(Number));
        const v = new Uint32Array(ciphertextV.split(',').map(Number));

        const seed = CryptoJS.SHA256(password + salt).toString();
        const { privateKey } = generateKeyPair(seed);

        const sharedSecret = decapsulate(privateKey, { u, v }, seed);

        let aesDecrypted;
        try {
            aesDecrypted = CryptoJS.AES.decrypt(pqEncrypted, sharedSecret, {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
                iv: CryptoJS.enc.Hex.parse(pqIv)
            });
        } catch (aesError) {
            throw new Error('AES decryption failed');
        }

        const aesEncrypted = aesDecrypted.toString(CryptoJS.enc.Utf8);
        if (aesEncrypted.length === 0) {
            throw new Error('AES decryption produced empty result');
        }

        const decrypted = CryptoJS.AES.decrypt(aesEncrypted, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (result.length === 0) {
            throw new Error('Final decryption produced empty result');
        }

        return result;
    };

    return {
        encrypt,
        decrypt
    };
};

export default KyberLike;