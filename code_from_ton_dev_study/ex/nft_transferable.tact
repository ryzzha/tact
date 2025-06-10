trait IsDeployed {
    deployed: Bool;

    fun requireDeployed() {
        require(self.deployed, "Not Inited");
    }
}

message(0x5fcc3d14) Transfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0xd53276db) Excesses {
    queryId: Int as uint64;
}

message(0x05138d91) OwnershipAssigned {
    queryId: Int as uint64;
    prevOwner: Address;
    forwardPayload: Slice as remaining;
}

trait NftTransferable with IsDeployed {
    const minBalance: Int = ton("0.02");
    const gasTransfer: Int = ton("0.02");
    deployed: Bool;
    owner: Address?;
    receive(msg: Transfer) {
        self.requireDeployed();
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Invalid Sender");
        let deltaBalance: Int = self.minBalance - min(self.minBalance, myBalance() - ctx.value);
        require(ctx.value > msg.forwardAmount + self.gasTransfer + deltaBalance + ctx.readForwardFee(), "Not enough coin");
        let cashback: Int = ctx.value - deltaBalance - self.gasTransfer;
        if (msg.forwardAmount > 0) {
            cashback = cashback - msg.forwardAmount - ctx.readForwardFee();
            send(SendParameters{
                to: msg.newOwner,
                value: msg.forwardAmount,
                mode: SendPayGasSeparately,
                body: OwnershipAssigned{
                    queryId: msg.queryId,
                    prevOwner: self.owner!!,
                    forwardPayload: msg.forwardPayload
                }.toCell()
            });
        }
        if (cashback > 0) {
            send(SendParameters{
                to: msg.responseDestination,
                value: cashback,
                body: Excesses{queryId: msg.queryId}.toCell()
            });
        }
        self.owner = msg.newOwner;
    }
}