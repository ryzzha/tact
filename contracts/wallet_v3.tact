
message RequestSendMessage {
    signature: Slice as bytes64;
    seqno: Int as uint32;
    validUntil: Int as uint32;
    mode: Int as uint8;
    message: Cell;
}

contract WalletV3 {
    publicKey: Int as uint256;
    seqno: Int as uint32 = 0;

    init(publicKey: Int) {
        self.publicKey = publicKey;
    }

    receive() {}
    receive(str: String) {}
    receive(msg: Slice) {}

    external(msg: RequestSendMessage) {
        let hash: Int = beginCell().storeUint(msg.seqno, 32).storeUint(msg.validUntil, 32).storeUint(msg.mode, 8).storeRef(msg.message).endCell().hash();
        require(checkSignature(hash, msg.signature, self.publicKey), "Fail to check signature");
        require(msg.seqno == self.seqno, "Seqno check failed");
        require(msg.validUntil >= now(), "validUntil check failed");
        acceptMessage();
        self.seqno += 1;
        nativeSendMessage(msg.message, msg.mode)
    }

    get fun seqno(): Int {
        return self.seqno;
    }

    get fun get_public_key(): Int {
        return self.publicKey;
    }
}
