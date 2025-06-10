import "./nft_transferable";
import "./nft_base_trait";

message DeployNftItem {
    owner: Address;
    content: Cell;
}

contract NftItem with NftBase, NftTransferable {
    deployed: Bool = false;
    index: Int as uint64;
    collection: Address;
    owner: Address? = null;
    content: Cell? = null;
    init(index: Int, collection: Address) {
        self.index = index;
        self.collection = collection;
    }

    receive(msg: DeployNftItem) {
        require(!self.deployed, "Already Inited");
        require(sender() == self.collection, "Invalid Sender");
        self.owner = msg.owner;
        self.content = msg.content;
        self.deployed = true;
        send(SendParameters{
            to: msg.owner,
            value: 1,
            mode: SendPayGasSeparately
        });
    }

    receive() {}
    receive(msg: Slice) {}
}
