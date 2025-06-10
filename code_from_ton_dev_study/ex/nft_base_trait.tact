
trait IsDeployed {
    deployed: Bool;

    fun requireDeployed() {
        require(self.deployed, "Not Inited");
    }
}

struct NftData {
    deployed: Bool;
    index: Int;
    collection: Address;
    owner: Address?;
    content: Cell?;
}

message(0x2fcb26a2) GetStaticData {
    queryId: Int as uint64;
}

message(0x8b771735) ReportStaticData {
    queryId: Int as uint64;
    index: Int as uint256;
    collection: Address;
}

trait NftBase with IsDeployed {
    deployed: Bool;
    index: Int;
    collection: Address;
    owner: Address?;
    content: Cell?;
    
    receive(msg: GetStaticData) {
        self.requireDeployed();
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: ReportStaticData {
                queryId: msg.queryId,
                index: self.index,
                collection: self.collection
            }.toCell()
        });
    }

    get fun get_nft_data(): NftData {
        return NftData{
            deployed: self.deployed,
            index: self.index,
            collection: self.collection,
            owner: self.owner,
            content: self.content
        };
    }
}