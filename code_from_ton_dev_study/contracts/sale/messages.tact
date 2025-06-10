message SetWalletAddress {
    walletAddress: Address;
}

message ServiceMessage {
    body: Cell;
    mode: Int as uint8;
}

message(0x5fcc3d14) NftTransfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Cell?;
}
message(0x05138d91) NftOwnershipAssigned {
    queryId: Int as uint64;
    prev_owner: Address;
    forwardPayload: Cell?;
}

message(0xf8a7ea5) Transfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Cell?;
}

message(0x7362d09c) TransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Cell?;
}